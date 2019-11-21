#include "FlashIAPBlockDevice.h"
#include "FATFileSystem.h"

#include <ArduinoBLE.h>

#define THRESHOLD 100
#define SLEEPTIME 1000
#define LOCKTIME 5000

REDIRECT_STDOUT_TO(Serial)

// constants & variables
int counter = 0;
const char locName[] = "Nano33BLE_prf";
const char srvID[] = "0a1f";
const char chrID[] = "0a2c";
byte value_0 = 0;

// create a service
BLEService service_0(srvID);
// create a characteristic
BLEByteCharacteristic characteristic_0 = BLEByteCharacteristic(chrID, BLERead | BLEWrite | BLENotify);

// create partition
static mbed::FATFileSystem fs("fs");
static FlashIAPBlockDevice bd(0x80000, 0x80000);

void fs_return_error(int ret_val)
{
  if (ret_val)
    printf("Failure. %d\r\n", ret_val);
  else
    printf("done.\r\n");
}

void fs_errno_error(void *ret_val)
{
  if (ret_val == NULL)
    printf(" Failure. %d \r\n", errno);
  else
    printf(" done.\r\n");
}

void ble_setup()
{
  while (!Serial)
    ;

  // begin initialization
  if (!BLE.begin())
  {
    Serial.println("starting BLE failed!");
    while (1)
      ;
  }

  // set name and advertised service
  BLE.setLocalName(locName);
  BLE.setDeviceName(locName);
  BLE.setAdvertisedService(service_0);

  // add characteristic to service
  service_0.addCharacteristic(characteristic_0);

  // add service
  BLE.addService(service_0);

  // set initial value of the characteristic
  characteristic_0.writeValue(value_0);

  // start advertising
  BLE.advertise();

  Serial.println();
  Serial.println("PERIPHERAL: STARTED ADVERTISING");
  Serial.println();
}

void setup()
{

  Serial.begin(115200);
  while (!Serial)
    ;

  // put your setup code here, to run once:
  int error = 0;
  printf("Welcome to the filesystem example.\r\n"
         "Formatting a FAT, RAM-backed filesystem. ");
  error = mbed::FATFileSystem::format(&bd);
  fs_return_error(error);

  printf("Mounting the filesystem on \"/fs\". ");
  error = fs.mount(&bd);
  fs_return_error(error);

  printf("Opening a new file, numbers.txt.");
  FILE *fd = fopen("/fs/numbers.txt", "w");
  fs_errno_error(fd);

  FILE *fd2 = fopen("/fs/dates.txt", "w");
  fprintf(fd2, "%s\r\n", "ciao fischer");

  // for (int i = 0; i < 20; i++)
  // {
  //   printf("Writing decimal numbers to a file (%d/20)\r\n", i);
  //   fprintf(fd, "%d\r\n", i);
  // }
  // printf("Writing decimal numbers to a file (20/20) done.\r\n");

  printf("Closing file.");
  fclose(fd);
  fclose(fd2);
  printf(" done.\r\n");

  printf("Re-opening file read-only.");
  fd = fopen("/fs/numbers.txt", "r");

  fd2 = fopen("/fs/dates.txt", "r");
  fs_errno_error(fd);

  printf("Dumping file to screen.\r\n");
  char buff[16] = {0};
  while (!feof(fd))
  {
    int size = fread(&buff[0], 1, 15, fd);
    fwrite(&buff[0], 1, size, stdout);
    // TODO add send via bluetooth
  }

  while (!feof(fd2))
  {
    int size = fread(&buff[0], 1, 15, fd2);
    fwrite(&buff[0], 1, size, stdout);
    // TODO add
  }
  printf("EOF.\r\n");

  printf("Closing file.");
  fclose(fd);
  fclose(fd2);
  printf(" done.\r\n");

  printf("Opening root directory.");
  DIR *dir = opendir("/fs/");
  fs_errno_error(fd);

  struct dirent *de;
  printf("Printing all filenames:\r\n");
  while ((de = readdir(dir)) != NULL)
  {
    printf("  %s\r\n", &(de->d_name)[0]);
  }

  printf("Closing root directory. ");
  error = closedir(dir);
  fs_return_error(error);
  printf("Filesystem Demo complete.\r\n");

  ble_setup();
}

void loop()
{
  // put your main code here, to run repeatedly:

  // listen for BLE peripherals to connect:
  BLEDevice central = BLE.central();

  // if a central is connected to peripheral:
  if (central)
  {

    Serial.print("--> Connected central: ");
    Serial.println(central.address());

    // reset value and notify
    value_0 = 0;
    characteristic_0.writeValue((byte)value_0);
    Serial.println("Reset!!!");

    // central still connected to peripheral
    while (central.connected())
    {

      Serial.println(counter);
      // preventing deadlock
      if (counter >= LOCKTIME)
      {
        counter = 0;
        characteristic_0.writeValue((byte)value_0);
        Serial.println("Preventing deadlock");
      }
      else
      {
        counter++;
      }

      // central wrote value
      // if (characteristic_0.written())
      // {

      // reset counter
      // counter = 0;

      // RSSI
      Serial.print("==>RSSI: ");
      Serial.println(central.rssi());

      // read value
      characteristic_0.readValue(value_0);
      Serial.print("Read value: ");
      Serial.println(value_0);

      // value above threshold ==> reset
      if (value_0 >= THRESHOLD)
      {
        value_0 = 0;
        Serial.println("Reset!!!");
      }
      // value below threshold ==> increment
      else
      {
        value_0++;
      }

      // sleep for a while
      delay(SLEEPTIME);

      // write value
      FILE *fd2 = fopen("/fs/dates.txt", "r");

      fs_errno_error(fd2);
      char buff[16] = {0};

      while (!feof(fd2))
      {
        int size = fread(&buff[0], 1, 16, fd2);
        // fwrite(&buff[0], 1, size, stdout);

        int i = 0;
        Serial.println(buff[i]);
        characteristic_0.writeValue(buff[i]);
        Serial.println("1 BYTE SENT");

        Serial.println("FILE SENT");
      }

      Serial.println("Reset!!!");
      // }
    }

    // central disconnected
    Serial.print(("<-- Disconnected central: "));
    Serial.println(central.address());
    Serial.println();

    // restart advertising
    BLE.stopAdvertise();
    BLE.advertise();
  }

  // restart advertising
  BLE.stopAdvertise();
  BLE.advertise();
}
