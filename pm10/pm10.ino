
void setup() {
  while(!Serial){
    Serial.println("Waiting serial");
  }
  
  Serial1.begin(9600); // Initialize serial with a baud rate of 115200 bps
  while(!Serial1) {
    Serial.println("Waiting for Serial1");
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

  
// Code adapted from https://github.com/ricki-z/SDS011/blob/master/SDS011.cpp
  if (Serial1) {
    byte recByte = Serial1.read();
//    Serial.println(recByte);
    int value = int(recByte);
    switch (len) {
      case (0): if (value != 170) { len = -1; return; }; break;
      case (1): if (value != 192) { len = -1; }; break;
      case (2): pm25_serial = value; checksum_is = value; break;
      case (3): pm25_serial += (value << 8); checksum_is += value; break;
      case (4): pm10_serial = value; checksum_is += value; break;
      case (5): pm10_serial += (value << 8); checksum_is += value; break;
      case (6): checksum_is += value; break;
      case (7): checksum_is += value; break;
      case (8): if (value == (checksum_is % 256)) { checksum_ok = 1; } else { len = -1; }; break;
      case (9): if (value != 171) { len = -1; }; break;
    }
    len++;
    if (len == 10 && checksum_ok == 1) {
      float p10 = (float)pm10_serial/10.0;
      float p25 = (float)pm25_serial/10.0;
      len = 0; checksum_ok = 0; pm10_serial = 0.0; pm25_serial = 0.0; checksum_is = 0;
//      error = 0;
      Serial.print("PM10: ");
      Serial.println(p10);
      Serial.print("PM2.5: ");
      Serial.println(p25);
    }
  }
}
