# CO2-mini to InfluxDB
# https://dounokouno.com/2018/05/27/raspberry-pi-co2-mini/
from co2meter import *
import urllib.request
import sys
import time
try:
    import pandas as pd
except ImportError:
    pd = None

url = sys.argv[1]

#sensor = CO2monitor('/dev/hidraw0')
sensor = CO2monitor()

def main():
    data = sensor.read_data()
    if pd and isinstance(data, pd.DataFrame):
        co2 = data.co2[0]
        temp = data.temp[0]
    else:
        co2 = data[1]
        temp = data[2]
    post2influx(co2, temp)

def post2influx(co2, temp):
    postbody = 'co2,sensor=CO2mini value={}\ntemperature,sensor=CO2mini value={}'.format(co2, temp)
    req = urllib.request.Request(url, postbody.encode())
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            pass
    except Exception as err:
        print(err)

if __name__ == '__main__':
    main()
