# fr-dash
[freee](https://p.secure.freee.co.jp/)の打刻を行うCLIツールです
ターミナルからコマンドで打刻できます
また、打刻時にSlackへ投稿も可能です

## 初期設定
_npmを用いるため、npmを先にインストールしてください_

1. このリポジトリをローカルにcloneします
   `$ git clone git@github.com:tosaka-n/fr-dash.git`
2. 必要なライブラリをインストールします
    `$ npm i`
3. 環境変数を設定します
  - `$ cp .env.sample .env`
  - Slack投稿に必要なものは下記です(.env.sampleに定義済み)  
    一度freeeのトークンとリフレッシュトークンを取得する必要があります(ログインが必要)  
    また、Slack Incomming Webhookを利用し、打刻するユーザと同じアイコン/名前にすることでユーザが投稿しているように見せかけることができます
    Slack Tokenを利用する場合は[slack_tokenブランチ](https://github.com/tosaka-n/fr-dash/tree/slack_token)を参考にしてください
    - freee_token
    - refresh_token
    - client_id
    - client_secret
    - channel
    - webhook_url
    - username
    - icon_url
4. どのディレクトリでも実行可能なようにnpm linkを張ります
    `$ npm link`
# 使い方
  - 出勤時: `fr-dash in`
  - 退勤時: `fr-dash out`
  - 休憩開始時: `fr-dash begin`
  - 休憩終了時: `fr-dash end`

## コマンド
  - in  : 出勤
  - out : 退勤
  - begin : 休憩開始
  - end : 休憩終了
