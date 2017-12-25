# 室温グラフ化

会社事務所の室温が暑すぎることがあるので、
室温ログをTIのSensorTagを使って記録するシステムを作りました。
Intel EdisonをSensorTagとWebサーバ間のgatewayとして使います。

ブラウザでのグラフ表示例:
![ブラウザでのグラフ表示例](samplewww.png)

### 構成

```
SensorTag ---[BLE]--- Intel Edison ---[http]--- Webサーバ
```

#### SensorTag CC2541DK
#### Intel Edison
* sensortag-gateway:
  [node-sensortag](https://github.com/sandeepmistry/node-sensortag)を使用して、
  SensorTagとBLE接続して、温度・湿度を取得し、
  WebサーバにHTTP POST。

##### Setup
```sh
cd sensortag-gateway
npm i
```

Edison起動時に自動起動するように、
sensortag.serviceファイルを、/etc/systemd/system/にコピーして、
`systemctl enable sensortag`

#### Webサーバ
rrdtoolにデータ記録。

* cgi-bin/roomtemper.cgi: EdisonのsensortagGateway.jsからのHTTP POSTを受けて、
  * rrdtoolにデータ追加
  * /tmp/roomtemper.log にHTTP POSTされた行を追加
* www/
* cron/rrdgraph.sh: cronで5分間隔で動かして、
  * rrdtoolでグラフPNG画像生成。温度と湿度の1日と1週間のグラフ。
  * 現在の温度・湿度が知りたい場合があるので、
    /tmp/roomtemper.logの最新の値を抜き出して、
    www以下のディレクトリにlatest.txtとlatest.jsonファイルとして生成。

##### Setup
* rrdtoolのデータファイル作成
```sh
rrdtool create temphumid.rrd DS:temper:GAUGE:1200:U:U DS:humidity:GAUGE:1200:U:U RRA:AVERAGE:0.5:1:600 RRA:AVERAGE:0.5:6:700 RRA:AVERAGE:0.5:24:775 RRA:AVERAGE:0.5:288:797 --start $(date -d '2017-12-15 00:00:00' '+%s')
```
* rrdtoolやcronで実行するスクリプトが更新するファイルのpermission設定
* `crontab -e`でcron/rrdgraph.shを5分間隔で実行する設定を追加

### 備考
* 室温は、赤外線温度センサの環境温度でなく、湿度センサの温度を使用。
  後者の方が約0.5℃高い。
  ガラス温度計と比較した所、後者の値の方が近かったので。

### TODO
* edisonのWi-Fi接続がしばらく切断される場合あり。
  その間のデータがサーバ側に送られないままになる。
  再接続されたら、切断中のデータをまとめて送る機能を追加する。
* CGIスクリプトを書き直す(現状のshell scriptは適当すぎるので)
