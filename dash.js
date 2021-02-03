#!/usr/bin/env node
'use strict'
const fetch = require("node-fetch");
const dotenv = require("dotenv");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "./.env") });
const { Command } = require("commander");
const fs = require('fs').promises;

const HR_BASE_URL = 'https://api.freee.co.jp/hr/api/v1/';
const REFRESH_TOKEN_URL = 'https://accounts.secure.freee.co.jp/public_api/token';
const freee_token = process.env.freee_token;
const refresh_token = process.env.refresh_token;
const post_message_url = "https://slack.com/api/chat.postMessage";
const slack_token = process.env.slack_token;
const username = process.env.username;
const icon_url = process.env.icon_url;
const channel = process.env.channel;

const clocks = {
  in: {
    type: 'clock_in',
    text: "出勤"
  },
  begin: {
    type: 'break_begin',
    text: '休憩'
  },
  end: {
    type: 'break_end',
    text: '再開'
  },
  out: {
    type: 'clock_out',
    text: '退勤'
  },
};
const program = new Command();
program.version('1.0.0');

program
  .arguments('<status>')
  .usage(`
  in: punch in freee
  out: punch out freee
  begin: begin break time
  end: end break time`
  )
  .action(async param => await punchHandler(param));
program.parse();

async function punchHandler(command) {
  console.log(command);
  try {
    console.time("log");
    await punch(command);
    console.timeEnd("log");
    console.log(`ok, now punch ${command}`)
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}
  
async function punch(status) {
  console.log(status)
  const tokens = await udpateToken();
  const userInfo = await getUserId(tokens.freee_token);
  const userId = userInfo.companies[0].employee_id;
  const companyId = userInfo.companies[0].id;
  const abailable = await getabailable(tokens.freee_token, userId, companyId);
  if (!abailable.available_types.includes(clocks[status].type)) {
    throw new Error(`not abailable: ${abailable.available_types}`);
  }
  await changeStatus(tokens.freee_token, userId, companyId, clocks[status].type);
  await sendMessage(clocks[status].text);
};

async function udpateToken() {
  const headers = { "Authorization": ` Bearer ${freee_token}`, "Content-Type": "application/json" };
  const client_id = process.env.client_id;
  const client_secret = process.env.client_secret;
  const raw = JSON.stringify({
    grant_type: "refresh_token",
    client_id,
    client_secret,
    refresh_token,
  });

  const options = {
    method: "POST",
    headers,
    body: raw
  }
  const result = await (await fetch(REFRESH_TOKEN_URL, options)).json();
  const updated = {
    freee_token: result.access_token,
    refresh_token: result.refresh_token,
    client_id,
    client_secret,
    channel,
    slack_token,
    username,
    icon_url
  };

  await fs.writeFile(path.join(__dirname, "./.env"),
    Object.keys(updated).map(v => `${v}=${updated[v]}`).join('\n')
  )
  return updated;
}

async function getUserId(token) {
  const options = defaultGETOption(token)
  const result = await (await fetch(HR_BASE_URL + '/users/me', options)).json();
  console.log(result);
  return result;
}

async function getabailable(token, userId, companyId) {
  const options = defaultGETOption(token)
  const result = await (await fetch(`${HR_BASE_URL}/employees/${userId}/time_clocks/available_types?company_id=${companyId}`, options)).json();
  console.log(result);
  return result;
}

async function changeStatus(token, userId, company_id, status) {
  const options = {
    method: 'POST',
    headers: createAuthHeader(token),
    body: JSON.stringify({
      company_id,
      type: status,
      base_date: timestampToTime(new Date())
    })
  };
  const result = await (await fetch(`${HR_BASE_URL}/employees/${userId}/time_clocks`, options)).json();
  console.log(result);
  return result;
}

function timestampToTime(date) {
  const yyyy = `${date.getFullYear()}`;
  const MM = `0${date.getMonth() + 1}`.slice(-2);
  const dd = `0${date.getDate()}`.slice(-2);

  return `${yyyy}-${MM}-${dd}`;
}

async function sendMessage(text) {
  const options = {
    method: 'POST',
    headers: createAuthHeader(slack_token),
    body: JSON.stringify({
      text,
      channel,
    })
  };
  const result = await (await fetch(`${post_message_url}`, options)).json();
  console.log(result);
}

function createAuthHeader(token) {
  return {
    "Authorization": ` Bearer ${token}`,
    "Content-Type": "application/json; charset=UTF-8"
  };
}

function defaultGETOption(token){
  return {
    method: 'GET',
    headers: {
      "Authorization": ` Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8"
    }
  };
}
