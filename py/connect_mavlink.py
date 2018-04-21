# Script qui se connecte au pixhawk et affiche toutes les X secondes les coordonnes GPS
# Ensuite, NODEJS recupere les infos pour ajouter a limage
#
from PIL import Image
import piexif
import datetime
import sys
from dronekit import connect, VehicleMode
from time import sleep
import time

#Verifie si du texte est du json
def is_json(myjson):
    try:
        json_object = json.loads(myjson)
    except ValueError, e:
        return False
    return True


def main():
    print("PYTHON OK")
    latitude = 0
    longitude = 0
    vehicle = connect('/dev/ttyACM0')
    print " GPS: %s" % vehicle.gps_0
    print " GPS: %s" % vehicle.location.global_frame.lat
    print " GPS: %s" % vehicle.location.global_frame.lon
    print " GPS: %s" % vehicle.home_location

    latitude = str(vehicle.location.global_frame.lat)
    longitude = str(vehicle.location.global_frame.lon)
    print('{"latitude":'+latitude +',"longitude":'+longitude+'}')

    while 1:
        a = raw_input()
        today = time.strftime("%Y-%m-%d %H:%M:%S")
        if(a=="photo"):
            print(str(today)+" -----PRENDRE PHOTO - "+a)
            latitude = str(vehicle.location.global_frame.lat)
            longitude = str(vehicle.location.global_frame.lon)
            print('{"latitude":'+latitude +',"longitude":'+longitude+'}')
            sleep(1)
        elif (a=="status"):
            print(str(today)+" ----STATUS - "+a)
            print " GPS: %s" % vehicle.gps_0
            print " GPS: %s" % vehicle.location.global_frame.lat
            print " GPS: %s" % vehicle.location.global_frame.lon
            latitude = str(vehicle.location.global_frame.lat)
            longitude = str(vehicle.location.global_frame.lon)
            print " GPS: %s" % vehicle.home_location
            print " Battery: %s" % vehicle.battery
            print " Last Heartbeat: %s" % vehicle.last_heartbeat
            print " Is Armable?: %s" % vehicle.is_armable
            print " System status: %s" % vehicle.system_status.state
            print " Mode: %s" % vehicle.mode.name    # settable
            if "." not in latitude:
                print "------------->>>>>>>ca deconne on reset<<<<<<<<-----"
                vehicle.close()
                vehicle = connect('/dev/ttyACM0')
        else:
            print(str(today)+" ----AUTRE MESSAGE - "+a)

#if(a=="photo"):
#    print("-----PRENDRE PHOTO - "+a)
    #takep(latitude,longitude)

def takep(latitude,longitude):
    print("----------------DEBUT PHOTO----------------")
    #Variables
    today = datetime.datetime.now()
    imageOriginal = "/dev/shm/mjpeg/cam.jpg"
    imageFinal = "photo_"+str(today.year)+"_"+str(today.month)+"_"+str(today.day)+"__"+str(today.hour)+"_"+str(today.minute)+"_"+str(today.second)+".jpg"

    #On charge la photo et sauvegarde la definitive
    im = Image.open(imageOriginal)
    im.save(imageFinal)

    #on recupere les coordonnes gps
    #on converti en chaine de caractere
    strLat = str(latitude)
    strLon = str(longitude)

    #on calcul les N S E W
    if latitude>=0:
    	latRef = 'N'
    else:
    	latRef='S'
    if longitude>=0:
    	lonRef = 'E'
    else :
    	lonRef='W'

    #On supprime la virugle
    strLat = strLat.replace('.','')
    strLon = strLon.replace('.','')

    #on load les exif data
    exif_dict = piexif.load(imageOriginal)

    #on ajoute les coordonnes
    exif_dict["GPS"][piexif.GPSIFD.GPSLatitudeRef] = latRef
    exif_dict["GPS"][piexif.GPSIFD.GPSLatitude] = [int(strLat),10000000]
    exif_dict["GPS"][piexif.GPSIFD.GPSLongitudeRef] = lonRef
    exif_dict["GPS"][piexif.GPSIFD.GPSLongitude] = [int(strLon), 10000000]
    exif_bytes = piexif.dump(exif_dict)
    piexif.insert(exif_bytes, imageFinal)

    #on check
    strLat = float(strLat)
    strLon = float(strLon)

    print(str((strLat/10000000))+" - "+str((strLon/10000000)))
    print("----------------FIN PHOTO----------------")

#start process
if __name__ == '__main__':
    main()
