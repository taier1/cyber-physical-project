
void setup() {
  Serial1.begin(9600); // Initialize serial with a baud rate of 115200 bps
  while(!Serial1) {
    Serial.println("Waiting for Serial1");
  }
  Serial.println("Setup done");
}

int counter = 0;
void loop() {
  Serial.println(millis()/1000); // Print running time in seconds
  if (Serial1.available()) {
    byte recByte = Serial1.read();
    Serial.println(recByte, HEX);
  }
    
//  delay(1000); // Wait 1 second
}
