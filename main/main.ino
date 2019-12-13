#include <Arduino.h>
#include <ArduinoBLE.h>

#define MAX_LEN 20

// Global variables

//RGB
const int ledPin = 22;
const int ledPin2 = 23;
const int ledPin3 = 24;

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
BLEDevice central;

void setup() {

  // Sensors setup

  // initialize usb serial communication at 9600 bits per second:
  Serial.begin(9600);

  // Initialize pm_sensor serial:
  Serial1.begin(9600);

  // RGB setup
  pinMode(22, OUTPUT);
  pinMode(23, OUTPUT);
  pinMode(24, OUTPUT);
  // BT setup

  // begin BT initialization
  if (!BLE.begin()) {
    Serial.println("Starting BLE failed!");
    Serial.println("Looping indefinetly");
    Serial.println("Please manually restart the board");

    while (1);
  }

  static auto name = "HARDUINO" + BLE.address();
  name.replace(":", "");
  BLE.setLocalName(name.c_str());

  BLE.setAdvertisedService(mobilePhoneService); // add the service UUID
  mobilePhoneService.addCharacteristic(mobilePhoneChar); // add the phone characteristic
  BLE.addService(mobilePhoneService); // Add the mobile phone service

  //BLE.setAdvertisedServiceUuid("12340000-E8F2-537E-4F6C-D104768A1214");

  BLE.advertise();

  Serial.println("Setup complete");

  while (!central) {
    // wait for a BLE central
    central = BLE.central();
    Serial.println("waiting for central connections...");
    digitalWrite(ledPin, HIGH);
    digitalWrite(ledPin2, LOW);
    digitalWrite(ledPin3, HIGH); //azzurro
    delay(500);
    digitalWrite(ledPin, HIGH);
    digitalWrite(ledPin2, HIGH);
    digitalWrite(ledPin3, HIGH);//blu
    delay(500);

//    digitalWrite(ledPin, LOW);
//    digitalWrite(ledPin2, LOW);
//    digitalWrite(ledPin3, LOW);//bianco
//    delay(1000);
//    digitalWrite(ledPin, LOW);
//    digitalWrite(ledPin2, LOW);
//    digitalWrite(ledPin3, HIGH); //giallo
//    delay(1000);
//    digitalWrite(ledPin, LOW);
//    digitalWrite(ledPin2, HIGH);
//    digitalWrite(ledPin3, HIGH); // rosso
//    delay(1000);
//    digitalWrite(ledPin, HIGH);
//    digitalWrite(ledPin2, LOW);
//    digitalWrite(ledPin3, LOW); / azzurro
//    delay(1000);
//    digitalWrite(ledPin, HIGH);
//    digitalWrite(ledPin2, LOW);
//    digitalWrite(ledPin3, HIGH); //verde
//    delay(1000);
//    digitalWrite(ledPin, HIGH);
//    digitalWrite(ledPin2, HIGH);
//    digitalWrite(ledPin3, LOW);//blu
//    delay(1000);
//
//    digitalWrite(ledPin, HIGH);
//    digitalWrite(ledPin2, HIGH);
//    digitalWrite(ledPin3, HIGH);//spento
//    delay(1000);
  }


}

void loop() {

  if (central.connected()) {

    // turn on the LED to indicate the connection:
    digitalWrite(ledPin, HIGH);
    digitalWrite(ledPin2, LOW);
    digitalWrite(ledPin3, HIGH);//verde

    // Protocol reading adapted from https://github.com/ricki-z/SDS011/blob/master/SDS011.cpp
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
          } else {
            processing = false;
          }; break;
      }
      len++;

      if (!processing) {
        // Air quality reading
        // read the input on analog pin 0:
        int sensorValue = analogRead(A0);

        int pm10 = pm10_serial / 10;
        int pm25 = pm25_serial / 10;

        // write inside the buffer
        String values = String(sensorValue);
        values += ",";
        values += String(pm10);
        values += ",";
        values += String(pm25);
        values += ";";
        values.toCharArray(data_to_send, MAX_LEN);

        mobilePhoneChar.writeValue((char*)data_to_send, MAX_LEN);

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
    delay(500);
  } else {
    Serial.println("No active BT connections");
    BLE.advertise();
    central = BLE.central();
    digitalWrite(ledPin, HIGH);
    digitalWrite(ledPin2, LOW);
    digitalWrite(ledPin3, LOW); //azzurro
    delay(500);
    digitalWrite(ledPin, HIGH);
    digitalWrite(ledPin2, HIGH);
    digitalWrite(ledPin3, LOW);//blu
    delay(500);
  }
}
