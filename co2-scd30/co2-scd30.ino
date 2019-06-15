// SCD30 CO2 sensor to InfluxDB on ESP32 Wi-Fi
#include <Wire.h>
#include "SparkFun_SCD30_Arduino_Library.h"
SCD30 airSensor;

// WPA2 Enterprise
// https://qiita.com/itinoe/items/fb59699661af1d7c3405
#include <WiFi.h>
#define WPA2_ENTERPRISE 1
#if WPA2_ENTERPRISE
#include <esp_wpa2.h> //wpa2 library for connections to Enterprise networks
#endif
// https://github.com/espressif/arduino-esp32/tree/master/libraries/HTTPClient
#include <HTTPClient.h>

#if WPA2_ENTERPRISE
#define EAP_IDENTITY "deton"
#endif
const char* ssid = "lab";
const char* password = "XXXXXX";
// influxdb
const char* url = "http://192.168.179.5:8086/write?db=roomdb";
int counter = 0;

void setup() {
    Wire.begin();
    Serial.begin(115200);
    airSensor.begin();
    airSensor.setMeasurementInterval(60); // [sec]
    delay(10);

    Serial.println();
    Serial.print("Connecting to network: ");
    Serial.println(ssid);
    WiFi.disconnect(true);  //disconnect form wifi to set new wifi connection
    WiFi.mode(WIFI_STA); //init wifi mode
#if WPA2_ENTERPRISE
    esp_wifi_sta_wpa2_ent_set_identity((uint8_t *)EAP_IDENTITY, strlen(EAP_IDENTITY));
    esp_wifi_sta_wpa2_ent_set_username((uint8_t *)EAP_IDENTITY, strlen(EAP_IDENTITY));
    esp_wifi_sta_wpa2_ent_set_password((uint8_t *)password, strlen(password));
    esp_wpa2_config_t config = WPA2_CONFIG_INIT_DEFAULT();
    esp_wifi_sta_wpa2_ent_enable(&config);
    WiFi.begin(ssid);
#else
    WiFi.begin(ssid, password);
#endif
    delay(1000);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
        counter++;
        if (counter >= 60) { //after 30 seconds timeout - reset board
            ESP.restart();
        }
    }
    Serial.println("");
    Serial.print("WiFi connected. IP address set: ");
    Serial.println(WiFi.localIP());
}

void loop() {
    delay(5*60*1000); // TODO: use deep sleep
    if (!airSensor.dataAvailable()) {
        return;
    }
    uint16_t co2 = airSensor.getCO2();
    Serial.print(co2);
    Serial.print(", ");
    float humidity = airSensor.getHumidity();
    Serial.print(humidity);
    Serial.print(", ");
    float temperature = airSensor.getTemperature();
    Serial.println(temperature);

    if (WiFi.status() == WL_CONNECTED) {
        counter = 0;
        //Serial.print("Wifi is still connected with IP: ");
        //Serial.println(WiFi.localIP());
    }else if (WiFi.status() != WL_CONNECTED) { //if we lost connection, retry
#if WPA2_ENTERPRISE
        WiFi.begin(ssid);
#else
        WiFi.begin(ssid, password);
#endif
    }
    while (WiFi.status() != WL_CONNECTED) { //during lost connection, print dots
        delay(500);
        Serial.print(".");
        counter++;
        if (counter >= 60) { //30 seconds timeout - reset board
            ESP.restart();
        }
    }

    // https://qiita.com/zakkied/items/ee68f6a49d7921549bc7
    HTTPClient http;
    http.setTimeout(2 * HTTPCLIENT_DEFAULT_TCP_TIMEOUT);
    http.begin(url);
    //Serial.print("Connecting to website: ");
    String postbody("co2,sensor=SCD30_01 value=" + String(co2)
            + "\nhumidity,sensor=SCD30_01 value=" + String(humidity)
            + "\ntemperature,sensor=SCD30_01 value=" + String(temperature));
    //Serial.println(postbody);
    //http.addHeader("Content-Type", "text/plain");
    int httpCode = http.POST(postbody);
    if (httpCode > 0) {
        Serial.printf("[HTTP] POST... code: %d\n", httpCode);
        //if (httpCode == HTTP_CODE_OK) {
        //    String payload = http.getString();
        //    Serial.println(payload);
        //}
    } else {
        Serial.printf("[HTTP] POST... failed, error: %s\n", http.errorToString(httpCode).c_str());
        Serial.println(url);
    }
    http.end();
}
