
void setup() {
  // initialize usb serial communication at 9600 bits per second:
  Serial.begin(9600);

  while (!Serial) {
    Serial.println("Waiting usb serial");
  }

  // Initialize pin serial:
  Serial1.begin(9600);
  while (!Serial1) {
    Serial.println("Waiting pin serial");
  }

  Serial.println("Setup done");
}

byte buffer;
int value;
int len = 0;
int pm10_serial = 0;
int pm25_serial = 0;
int checksum_is;
int checksum_ok = 0;
//  int error = 1;

void loop() {

  delay(200);


  //  Serial.println(millis()/1000); // Print running time in seconds


  // Protocol reading adapted from https://github.com/ricki-z/SDS011/blob/master/SDS011.cpp
  if (Serial1) {
    byte recByte = Serial1.read();
    // to debug the protocol
    // Serial.println(recByte);
    int value = int(recByte);
    switch (len) {
      case (0): if (value != 170) {
          len = -1;
          return;
        }; break;
      case (1): if (value != 192) {
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
          len = -1;
        }; break;
      case (9): if (value != 171) {
          len = -1;
        }; break;
    }
    len++;
    if (len == 10 && checksum_ok == 1) {
      // Air quality reading
      // read the input on analog pin 0:
      int sensorValue = analogRead(A0);

      // Air quality printing
      Serial.print("Air quality: ");
      Serial.println(sensorValue);

      // PM values printing
      Serial.print("PM10: ");
      Serial.println(pm10_serial);
      Serial.print("PM2.5: ");
      Serial.println(pm25_serial);
      len = 0; checksum_ok = 0; pm10_serial = 0.0; pm25_serial = 0.0; checksum_is = 0;
    } else if (len == 10 && checksum_ok == 0) {
      Serial.println("checksum error!");
      Serial.println(checksum_is);
      Serial.println(checksum_ok);
    }
  } else {
    Serial.println("Serial port not found");
  }
}