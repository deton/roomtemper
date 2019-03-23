# CO2-mini to InfluxDB
# https://dounokouno.com/2018/05/27/raspberry-pi-co2-mini/
from co2meter import *
import urllib.request
import sys
import time

url = sys.argv[1]

#sensor = CO2monitor('/dev/hidraw0')
sensor = CO2monitor()

def main():
    data = sensor.read_data()
    post2influx(data)

def post2influx(data):
    postbody = 'co2,sensor=CO2mini value={}\ntemperature,sensor=CO2mini value={}'.format(data[1], data[2])
    req = urllib.request.Request(url, postbody.encode())
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            pass
    except Exception as err:
        print(err)

if __name__ == '__main__':
    main()
