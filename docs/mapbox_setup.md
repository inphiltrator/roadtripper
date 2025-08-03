# **MapBox Setup für Southwest USA Roadtripper**

## **1\. MapBox Account erstellen**

1. Gehe zu [https://account.mapbox.com/auth/signup/](https://account.mapbox.com/auth/signup/)  
2. Erstelle einen kostenlosen Account  
3. Verifiziere deine E-Mail-Adresse

## **2\. API-Key generieren**

1. Navigiere zu [https://account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/)  
2. **Public Token** (für Frontend): Beginnt mit pk.  
3. **Secret Token** (für Backend): Beginnt mit sk.

## **3\. Environment Variables**

Erstelle eine .env Datei im Projektverzeichnis:  
\# .env  
DATABASE\_URL="file:./data/roadtripper.db"

\# MapBox API Keys  
MAPBOX\_PUBLIC\_TOKEN="pk.eyJ1IjoidXNlcm5hbWUiLCJhIjoiY2xxxxxxxxx"  
MAPBOX\_SECRET\_TOKEN="sk.eyJ1IjoidXNlcm5hbWUiLCJhIjoiY2xxxxxxxxx"

\# OpenRouteService (optional)  
OPENROUTESERVICE\_API\_KEY="your-ors-key"

## **4\. Southwest USA Bounds**

// Geografische Grenzen für Southwest USA  
export const SOUTHWEST\_BOUNDS \= {  
  bbox: '-124.5,32.5,-109.0,42.0',  
  southwest: \[-124.5, 32.5\],  
  northeast: \[-109.0, 42.0\]  
};

## **5\. Rate Limits (Free Tier)**

* **Geocoding**: 100,000 requests/month  
* **Maps**: 50,000 map loads/month  
* **Directions**: 100,000 requests/month

Für ein privates Projekt mehr als ausreichend\!

## **6\. API-Endpoints**

### **Geocoding (Search)**

https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json

### **Reverse Geocoding**

https://api.mapbox.com/geocoding/v5/mapbox.places/{lng},{lat}.json

### **Parameter für Southwest-Filter**

* country=us \- Nur USA  
* bbox=-124.5,32.5,-109.0,42.0 \- Southwest Bounds  
* types=poi,address,place \- POI-Typen  
* limit=5 \- Max. Ergebnisse

## **7\. Test-Queries**

\# Test 1: Las Vegas  
curl "https://api.mapbox.com/geocoding/v5/mapbox.places/Las%20Vegas.json?access\_token=YOUR\_TOKEN\&country=us\&bbox=-124.5,32.5,-109.0,42.0"

\# Test 2: Grand Canyon  
curl "https://api.mapbox.com/geocoding/v5/mapbox.places/Grand%20Canyon.json?access\_token=YOUR\_TOKEN\&country=us\&bbox=-124.5,32.5,-109.0,42.0"

## **Nächste Schritte**

1. ✅ Account erstellen  
2. ✅ API-Keys generieren  
3. ✅ .env Datei erstellen  
4. 🔄 SvelteKit Proxy implementieren  
5. 🔄 Test-Queries ausführen



MapBox Setup für Southwest USA Roadtripper1. MapBox Account erstellenGehe zu https://account.mapbox.com/auth/signup/Erstelle einen kostenlosen AccountVerifiziere deine E-Mail-Adresse2. API-Key generierenNavigiere zu https://account.mapbox.com/access-tokens/Public Token (für Frontend): Beginnt mit pk.Secret Token (für Backend): Beginnt mit sk.3. Environment VariablesErstelle eine .env Datei im Projektverzeichnis:# .env
DATABASE_URL="file:./data/roadtripper.db"

# MapBox API Keys
MAPBOX_PUBLIC_TOKEN="pk.eyJ1IjoidXNlcm5hbWUiLCJhIjoiY2xxxxxxxxx"
MAPBOX_SECRET_TOKEN="sk.eyJ1IjoidXNlcm5hbWUiLCJhIjoiY2xxxxxxxxx"

# OpenRouteService (optional)
OPENROUTESERVICE_API_KEY="your-ors-key"
4. Southwest USA Bounds// Geografische Grenzen für Southwest USA
export const SOUTHWEST_BOUNDS = {
  bbox: '-124.5,32.5,-109.0,42.0',
  southwest: [-124.5, 32.5],
  northeast: [-109.0, 42.0]
};
5. Rate Limits (Free Tier)Geocoding: 100,000 requests/monthMaps: 50,000 map loads/monthDirections: 100,000 requests/monthFür ein privates Projekt mehr als ausreichend!6. API-EndpointsGeocoding (Search)https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json
Reverse Geocodinghttps://api.mapbox.com/geocoding/v5/mapbox.places/{lng},{lat}.json
Parameter für Southwest-Filtercountry=us - Nur USAbbox=-124.5,32.5,-109.0,42.0 - Southwest Boundstypes=poi,address,place - POI-Typenlimit=5 - Max. Ergebnisse7. Test-Queries# Test 1: Las Vegas
curl "https://api.mapbox.com/geocoding/v5/mapbox.places/Las%20Vegas.json?access_token=YOUR_TOKEN&country=us&bbox=-124.5,32.5,-109.0,42.0"

# Test 2: Grand Canyon
curl "https://api.mapbox.com/geocoding/v5/mapbox.places/Grand%20Canyon.json?access_token=YOUR_TOKEN&country=us&bbox=-124.5,32.5,-109.0,42.0"
Nächste Schritte✅ Account erstellen✅ API-Keys generieren✅ .env Datei erstellen🔄 SvelteKit Proxy implementieren🔄 Test-Queries ausführen