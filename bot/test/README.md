# pui-core bot/test MVP API

missyou の送信MVP用に、`bot/test` 配下だけでPostgresとAPIサーバを起動する構成です。
Firebaseや外部DBは使わず、pui-core内のDocker Composeで完結します。

## 構成

```text
bot/test/
  docker-compose.yml      # Postgres + API
  db/init/001_schema.sql  # 初期スキーマ
  public/                 # 外部公開するAPIサーバ
  secrets/                # APNs秘密鍵置き場。git管理外
```

## 初回起動

```bash
cd bot/test
cp .env.example .env
docker compose up
```

APIは既定で `http://localhost:8080` に立ちます。

```bash
curl http://localhost:8080/health
```

`.env` に `PUI_CORE_API_KEY` を設定した場合、API呼び出しには `X-API-Key` が必要です。

## API

### `POST /v1/devices/register`

iOS端末のAPNs tokenを登録します。

```json
{
  "installationId": "device-local-install-id",
  "platform": "ios",
  "apnsToken": "apns-device-token",
  "appVersion": "0.1.0"
}
```

### `POST /v1/invites/create`

フレンド招待コードを作成します。

```json
{
  "ownerDeviceId": "device-uuid",
  "displayName": "Tsuka",
  "expiresInHours": 72
}
```

### `POST /v1/invites/accept`

招待コードを受け取り、2端末間のfriendshipを作成します。

```json
{
  "code": "ABCDE12345",
  "acceptorDeviceId": "device-uuid"
}
```

### `POST /v1/signals/send`

スタンプをDBに保存し、APNs設定が揃っていれば相手端末へpushします。

```json
{
  "friendshipId": "friendship-uuid",
  "senderDeviceId": "device-uuid",
  "clientSignalId": "ios-generated-id",
  "mood": "littleLonely",
  "note": "少しだけ声が聞きたい"
}
```

### `POST /v1/signals/send-direct`

MVP向けに、端末内で交換した相手のユーザーIDへ直接スタンプを送ります。
送信者・受信者の `installationId` が登録済みなら、サーバ側でfriendshipを自動作成または再利用します。

```json
{
  "senderInstallationId": "sender-device-uuid",
  "recipientInstallationId": "recipient-device-uuid",
  "clientSignalId": "ios-generated-id",
  "mood": "whatsUp",
  "thumbnailName": "stamp-whats-up"
}
```

APNs payloadには `mutable-content: 1` と `thumbnailName` を含めます。
iOSアプリ側のNotification Service Extensionが同梱スタンプ画像を添付し、通知にサムネイルとして表示します。
`mood` が `whatsUp` かつ写真添付が無い場合は、payloadに `signalIntent: "photo_request"` と
`senderInstallationId` を含めます。受信側iOSは通知タップ時にカメラを起動し、撮影画像を同じ
`send-direct` で `mood: "whatsUp"` と写真添付付きの `photo_response` として送り返します。

### `GET /v1/signals/pending?deviceId=...`

APNsを受け損ねた端末が未取得スタンプを取りに行くための簡易エンドポイントです。
取得した行は `delivered_at` が入り、次回以降は返りません。

## APNs

APNsを有効にする場合は `.env` に以下を設定し、`.p8` を `bot/test/secrets/apns/AuthKey.p8` に置きます。
`secrets/` はgit管理外です。

```text
APNS_ENV=sandbox
APNS_TEAM_ID=...
APNS_KEY_ID=...
APNS_BUNDLE_ID=com.pui-core.missyou
APNS_AUTH_KEY_PATH=/run/secrets/apns/AuthKey.p8
```

APNs設定が空の場合、`/v1/signals/send` はDB保存のみを行い、レスポンスの `delivery.status` は `skipped` になります。
