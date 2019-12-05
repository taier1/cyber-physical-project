#include <Arduino.h>
#include <ArduinoBLE.h>

#define MAX_LEN 20

// Global variables

//BT
char data_to_send[MAX_LEN];
BLEService mobilePhoneService("180F");
BLECharacteristic mobilePhoneChar("2A19",  // standard 16-bit characteristic UUID
                                  BLEWrite |
                                  BLERead |
                                  BLENotify, MAX_LEN,
                                  false); // remote clients will be able to get notifications if this characteristic changes

//Sensors
byte buffer;
int value;
int len = 0;
int pm10_serial = 0;
int pm25_serial = 0;
int checksum_is;
int checksum_ok = 0;

void setup() {

  // Sensors setup

  // initialize usb serial communication at 9600 bits per second:
  Serial.begin(9600);

    while (!Serial) {
//      Serial.println("Waiting usb serial");
    }

  // Initialize pin serial:
  Serial1.begin(9600);
  while (!Serial1) {
    Serial.println("Waiting pin serial");
  }


  // BT setup
  pinMode(LED_BUILTIN, OUTPUT); // initialize the built-in LED pin to indicate when a phone is connected

  // begin BT initialization
  if (!BLE.begin()) {
    Serial.println("starting BLE failed!");
    Serial.println("Looping indefinetly");

    while (1);
  }

  static auto name = "ARDUINO" + BLE.address();
  name.replace(":", "");
  BLE.setLocalName(name.c_str());

  BLE.setAdvertisedService(mobilePhoneService); // add the service UUID
  mobilePhoneService.addCharacteristic(mobilePhoneChar); // add the phone characteristic
  BLE.addService(mobilePhoneService); // Add the mobile phone service

  //BLE.setAdvertisedServiceUuid("12340000-E8F2-537E-4F6C-D104768A1214");

  BLE.advertise();

  Serial.println("Bluetooth device active, waiting for connections...");

  Serial.println("Setup done");

}

void loop() {
//  Serial.println(millis() / 1000); // Print running time in seconds


  // wait for a BLE central
  BLEDevice central = BLE.central();

  if (central) {

    // turn on the LED to indicate the connection:
    digitalWrite(LED_BUILTIN, HIGH);

    // if one central is connected:
    if (central.connected()) {

      // Protocol reading adapted from https://github.com/ricki-z/SDS011/blob/master/SDS011.cpp
      if (Serial1) {

        boolean processing = true;
        while (Serial1.available() > 0 && processing) {                   

          byte recByte = Serial1.read();
          // to debug the protocol
          // Serial.println(recByte);
          int value = int(recByte);
          switch (len) {
            case (0): if (value != 170) {
                len = -1;
                Serial.println("Header error");
              }; break;
            case (1): if (value != 192) {
                Serial.println("Command error");
                len = -1;
              }; break;
            case (2): pm25_serial = value; checksum_is = value; break;
            case (3): pm25_serial += (value << 8); checksum_is += value; break;
            case (4): pm10_serial = value; checksum_is += value; break;
            case (5): pm10_serial += (value << 8); checksum_is += value; break;
            case (6): checksum_is += value; break;
            case (7): checksum_is += value; break;
            case (8): if (value == (checksum_is % 256)) {
                checksum_ok = 1;
              } else {                
                Serial.println("Checksum error");
                len = -1;
              }; break;
            case (9): if (value != 171) {
                Serial.println("Tail error");
                len = -1;
              }else{
                processing = false;
              }; break;
          }
          len++;
          
          if (!processing) {
            // Air quality reading
            // read the input on analog pin 0:
            int sensorValue = analogRead(A0);

            int pm10 = pm10_serial/10;
            int pm25 = pm25_serial/10;

            // write inside the buffer
            String values = String(sensorValue);
            values += ",";
            values += String(pm10);
            values += ",";
            values += String(pm25);
            values += ";";
            values.toCharArray(data_to_send, MAX_LEN);

            mobilePhoneChar.writeValue((char*)data_to_send, MAX_LEN);
            Serial.println(". Value sent");

            // Air quality printing
            Serial.print("Air quality: ");
            Serial.println(sensorValue);

            // PM values printing
            Serial.print("PM10: ");
            Serial.println(pm10);
            Serial.print("PM2.5: ");
            Serial.println(pm25);
            len = 0; checksum_ok = 0; pm10_serial = 0.0; pm25_serial = 0.0; checksum_is = 0;
          } 
        }
      } else {
        Serial.println("Serial port not found");
      }

    } else {
      Serial.println("Central not connected");
      BLE.advertise();
    }
    delay(200);
  } else {
    Serial.println("BT disconnected");
    delay(1000);
  }
}
