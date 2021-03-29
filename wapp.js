var current_data;
var location_data;
var forecast;
var latitude;
var longitude;
var closest_station;
var aqhi_data;

async function current_start(){
    try{
        let response = await fetch("https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en");
        if (response.status == 200){
            current_data = await response.json();
            console.log(current_data);
        }
        else{
            console.log(current_data);
        }
    }
    catch(err){
        console.log("Fetch Error!");
    }
};

    async function aqhi_get(){
        try{
            let response = await fetch("https://dashboard.data.gov.hk/api/aqhi-individual?format=json");
            if (response.status == 200){
                aqhi_data = await response.json();
            }
            else{
                console.log(aqhi_data);
            }
        }
        catch(err){
            console.log("Fetch Error!");
        }
    };

    async function location_nearest(){
        var lat = latitude * Math.PI/180;
        var long = longitude * Math.PI/180;
        const R = 6371e3;
        var json_station_location = '[{"station":"Central/Western","lat":22.284792,"lng":114.14413907799911},{"station":"Southern","lat":22.2479312,"lng":114.1601149},{"station":"Eastern","lat":22.2830774,"lng":114.21900057191323},{"station":"Kwun Tong","lat":22.3098052,"lng":114.2315367557473},{"station":"Sham Shui Po","lat":22.330405213400752,"lng":114.15939550471612},{"station":"Kwai Chung","lat":22.356942949999997,"lng":114.1293283974214},{"station":"Tsuen Wan","lat":22.371890560773316,"lng":114.11512300841532},{"station":"Tseung Kwan O","lat":22.31754838890652,"lng":114.2602613427978},{"station":"Yuen Long","lat":22.4449384,"lng":114.0228013},{"station":"Tuen Mun","lat":22.39139578334337,"lng":113.97736173910037},{"station":"Tung Chung","lat":22.289109238190928,"lng":113.94412689677011},{"station":"Tai Po","lat":22.45125422341408,"lng":114.16439708937546},{"station":"Sha Tin","lat":22.376768772361523,"lng":114.18537610046992},{"station":"North","lat":22.496930300000002,"lng":114.12833606569419},{"station":"Tap Mun","lat":22.471330169476424,"lng":114.36096390768151},{"station":"Causeway Bay","lat":22.28050141982767,"lng":114.18588316608526},{"station":"Central","lat":22.28185169591833,"lng":114.15807261990376},{"station":"Mong Kok","lat":22.322578835466118,"lng":114.16836839255906}]';
        var station_location = JSON.parse(json_station_location);
        var shortest_distance = 100000000;
        var iter3;
        
        for (iter3 = 0; iter3 < station_location.length; iter3++){
            var station_latitude = station_location[iter3].lat;
            var station_longitude = station_location[iter3].lng;
            var stat_lat = station_latitude * Math.PI/180;
            var stat_long = station_longitude * Math.PI/180;
            const x = (stat_lat-lat) * Math.cos((stat_long+long)/2);
            const y = (stat_long-long);
            distance = Math.sqrt(x*x + y*y) * R;
            if (distance < shortest_distance){
                closest_station = station_location[iter3].station;
                shortest_distance = distance;
            }
        }
    }

async function find_closest(){
    await aqhi_get();
    await location_nearest();
    console.log(aqhi_data);
    console.log(closest_station);
    var iter4;
    for (iter4 = 0; iter4 < aqhi_data.length; iter4++){
        if (aqhi_data[iter4].station == closest_station){

            location_risk_text.appendChild(document.createTextNode(aqhi_data[iter4].aqhi+" | "+aqhi_data[iter4].health_risk));
            location_temp.appendChild(document.createTextNode(current_data.temperature.data[0].value+ " ˚C"));

            if (aqhi_data[iter4].health_risk == "Low"){
                location_risk_img.src = "images/aqhi-low.png";
            }
            if (aqhi_data[iter4].health_risk == "Moderate"){
                location_risk_img.src = "images/aqhi-moderate.png";
            }
            if (aqhi_data[iter4].health_risk == "High"){
                location_risk_img.src = "images/aqhi-high.png";  
            }
            if (aqhi_data[iter4].health_risk == "Very High"){
                location_risk_img.src = "images/aqhi-very_high.png";    
            }
            if (aqhi_data[iter4].health_risk == "Serious"){
                location_risk_img.src = "images/aqhi-serious.png";  
            }
        }
    }
}

const successfulCallback = (position) => {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`)
    .then(response => response.json())
    .then(output => location_data = output)
    .then(() => location_load());
    
};

const errorCallback = (error) => {
    console.log(error);
};

async function location_load(){
    console.log(location_data);
    location_district.appendChild(document.createTextNode(location_data.address.city_district));
    if ((location_data.address.suburb.length != 0)||(location_data.address.suburb != " ")){
        location_suburb.appendChild(document.createTextNode(location_data.address.suburb));
    }
    else{
        location_suburb.style.display= "none";
    }

    var iter2;
    location_rainfall_img.style.display = "flex";
    for (iter2 = 0; iter2 < current_data.rainfall.data.length; iter2++){
        if (current_data.rainfall.data[iter2].place.replace("&amp;", "and") == location_data.address.city_district){
            location_rainfall_value.appendChild(document.createTextNode(current_data.rainfall.data[iter2].max+" mm"));
            location_rainfall_img.src = "images/rain-48.png"; 
        }
        else{
            location_rainfall_value.appendChild(document.createTextNode(""));
        }
    }
    await find_closest();
}

async function weatherforecast() {
    try {
      let response = await fetch(
        "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd&lang=en"
      );
      if (response.status === 200) {
        forecast_data = await response.json();
      } else {
        console.log(forecast_data);
      }
    } catch (err) {
      console.log("Error!");
    }
  }

async function render(){
    //get location
    navigator.geolocation.getCurrentPosition(successfulCallback, errorCallback, {
        //true = accurate but slow, false (default) faster but innaccurate
        enableHighAccuracy: false,
        //milliseconds before error callback is invoked
        timeout: 5000
    });
    //fetch weather data api
    await current_start();
    await weatherforecast();

    title = document.createElement('header');
    title.classList.add("title");
    document.body.appendChild(title);
    title.appendChild(document.createTextNode("My Weather Portal"));

// Header block
    header = document.createElement('header');
    header.classList.add("header");
    document.body.appendChild(header);

    //Add background image
    //TBD

        header_title = document.createElement('div');
        header_title.classList.add("header_title");
        header_title.innerHTML = "Hong Kong <br/>"
        header.appendChild(header_title);

        header_info = document.createElement('div');
        header_info.classList.add("header_info");
        header.appendChild(header_info);

        current_icon = document.createElement('div');
        current_temp = document.createElement('div');
        current_humidity = document.createElement('div');
        current_rainfall = document.createElement('div');
        current_uv = document.createElement('div');

        current_icon.classList.add("current_icon");
        current_temp.classList.add("current_temp");
        current_humidity.classList.add("current_humidity");
        current_rainfall.classList.add("current_rainfall");
        current_uv.classList.add("current_uv");

        header_info.appendChild(current_icon);
        header_info.appendChild(current_temp);
        header_info.appendChild(current_humidity);
        header_info.appendChild(current_rainfall);
        header_info.appendChild(current_uv);

    //Image icon

        //Weather
        current_icon_img = document.createElement('img');
            current_icon_img.classList.add("current_icon_img");
            current_icon.appendChild(current_icon_img);
            ///Load image in current_icon of header block
            var weather_icon = "https://www.hko.gov.hk/images/HKOWxIconOutline/pic"+current_data.icon[0]+".png";
            current_icon_img.src = weather_icon;
            current_icon_img.alt = "Weather Icon"
        
        //Humidity
        current_humidity_icon_img = document.createElement('img');
            current_humidity_icon_img.classList.add("current_humidity_icon_img");
            current_humidity.appendChild(current_humidity_icon_img);
            ///Load image in humidity of header block
            current_humidity_icon_img.src = "images/drop-48.png";
            current_humidity_icon_img.alt = "Humidity Icon"
            current_humidity_icon_img.height = "30"
        
        //Rainfall
        current_rainfall_icon_img = document.createElement('img');
        current_rainfall_icon_img.classList.add("current_rainfall_icon_img");
        current_rainfall.appendChild(current_rainfall_icon_img);
            ///Load image in humidity of header block
            current_rainfall_icon_img.src = "images/rain-48.png";
            current_rainfall_icon_img.alt = "Rainfall Icon"
            current_rainfall_icon_img.height = "30"
        
        //UV
        current_uv_icon_img = document.createElement('img');
        current_uv_icon_img.classList.add("current_uv_icon_img");
        current_uv.appendChild(current_uv_icon_img);
            ///Load image in humidity of header block
            current_uv_icon_img.src = "images/UVindex-48.png";
            current_uv_icon_img.alt = "UV Icon"
            current_uv_icon_img.height = "30"     

    ///
        current_temp.appendChild(document.createTextNode("  "+ current_data.temperature.data[1].value+ " ˚C"));

        current_humidity.appendChild(document.createTextNode("  "+ current_data.humidity.data[0].value+" %"));

        current_rainfall.appendChild(document.createTextNode("  "+ current_data.rainfall.data[13].max +" mm"));

        if (current_data.rainfall.data[13].max>0){
            if (current_data.updateTime.substring(11,13) < 18){
                header.style.backgroundImage = url('images/water-drops-glass-day.jpg');
            }
            else{
                header.style.backgroundImage = url('images/water-drops-glass-night.jpg');
                header.style.color = "white";
            }
        }
        if (current_data.rainfall.data[13].max==0){
            if (current_data.updateTime.substring(11,13) < 18){
                header.style.backgroundImage = "url('images/blue-sky.jpg')";
            }
            else{
                header.style.backgroundImage = "url('images/night-sky.jpg')"
                header.style.color = "white";
            }
        }
    
        console.log(current_data.uvindex)
            if ((current_data.uvindex.length != 0) &&  (current_data.uvindex != undefined) && (current_data.uvindex != "")) {
                current_uv.appendChild(document.createTextNode("  "+ current_data.uvindex.data[0].value));
            } else {
                current_uv.style.display = "none";
            }
        
            last_update = document.createElement('div');
            last_update .classList.add("last_update");
            header.appendChild(last_update );
            last_update.appendChild(document.createTextNode("Last Update: "+ current_data.updateTime.substring(0, 10)+" "+current_data.updateTime.substring(11, 16)));
        
            warning = document.createElement('div');
            warning.classList.add("warning");
            header.appendChild(warning);
        
            warningButton = document.createElement('button');
            warningButton.id = "warningButton";
        
            warningButton.onclick = function toggleWarning() {
                if (warningMessage.style.display == "block"){
                    warningMessage.style.display = "none";
                }
                else{
                    warningMessage.style.display = "block";
                }
              }
        
            warning.appendChild(warningButton);
            warningButton.appendChild(document.createTextNode("Warning"));
        
            warningMessage = document.createElement('div');
            warningMessage.id = "warningMessage";
            warningMessage.style.display = "none";
            warning.appendChild(warningMessage);
        
            if (current_data.warningMessage.length != 0) {
                warningMessage.appendChild(document.createTextNode(current_data.warningMessage[0]));
              } else {
                warningMessage.appendChild(document.createTextNode("Dummy"));
                warning.style.display = "none";
                //warning.style.display = "block";
                
              }
    
    //My data block

    mydata = document.createElement('div');
    mydata.classList.add("mydata");
    document.body.appendChild(mydata);

        location_block = document.createElement('div');
        location_block.classList.add("location_block");
        mydata.appendChild(location_block);
        
            location_title = document.createElement('div');
            location_title.classList.add("location_title");
            location_title.innerHTML = "My Location <br/>"
            location_block.appendChild(location_title);    

            location_district = document.createElement('div');
            location_district.classList.add("location_district");
            location_block.appendChild(location_district);

            location_suburb = document.createElement('div');
            location_suburb.classList.add("location_suburb");
            location_block.appendChild(location_suburb);

            location_rainfall = document.createElement('div');
            location_rainfall.classList.add("location_rainfall");
            location_block.appendChild(location_rainfall);

                location_rainfall_img = document.createElement('img');
                location_rainfall_img.classList.add("location_rainfall_img");
                location_rainfall_img.style.display = "none";
                location_rainfall.appendChild(location_rainfall_img);

                location_rainfall_value = document.createElement('div');
                location_rainfall_value.classList.add("location_rainfall_value");
                location_rainfall.appendChild(location_rainfall_value);
                
            location_temp = document.createElement('div');
            location_temp.classList.add("location_temp");
            location_block.appendChild(location_temp);

            location_risk = document.createElement('div');
            location_risk.classList.add("location_risk");
            location_block.appendChild(location_risk);

                location_risk_img = document.createElement('img');
                location_risk_img.classList.add("location_risk_img");
                location_risk.appendChild(location_risk_img);

                location_risk_text = document.createElement('div');
                location_risk_text.classList.add("location_risk_text");
                location_risk.appendChild(location_risk_text);
        
        temp_block = document.createElement('div');
        temp_block.classList.add("temp_block");
        mydata.appendChild(temp_block);
        
            temp_title = document.createElement('div');
            temp_title.classList.add("temp_title");
            temp_title.innerHTML = "Temperatures <br/>"
            temp_block.appendChild(temp_title);  

            temp_dropdown = document.createElement('div');
            temp_dropdown.classList.add("temp_dropdown");
            temp_block.appendChild(temp_dropdown);

            temp_select = document.createElement('select');
            temp_select.id = "temp_select";
            temp_dropdown.appendChild(temp_select);

            //sort districts alphabetically
            function bubbleSort(arr){
                var iter;
                var jter;
                var len = arr.length;
                for (var iter = len-1; iter>=0; iter--){
                  for(var jter = 1; jter<=iter; jter++){
                    if(arr[jter-1].place>arr[jter].place){
                        var temp = arr[jter-1];
                        arr[jter-1] = arr[jter];
                        arr[jter] = temp;
                     }
                  }
                }
                return arr;
             }

            var district_data = bubbleSort(current_data.temperature.data);
            console.log(district_data);

            var step;
            for (step = 0; step < district_data.length; step++){
                temp_option = document.createElement('option');
                temp_option.classList.add("temp_option");
                temp_option.appendChild(document.createTextNode(district_data[step].place))
                temp_select.appendChild(temp_option);
            }

            var chosen = district_data[0];
                //add temperature based on selected option
                temp_select.onchange = function changeFunc() {
                    var selectBox = document.getElementById("temp_select");
                    var selectedValue = selectBox.options[selectBox.selectedIndex].text;

                    //find selected value in district_data. Chosen is the object containing the corresponding value
                    for (step = 0; step < district_data.length; step++){
                        if (selectedValue == district_data[step].place){
                            chosen = district_data[step];
                            node = document.getElementById("temp_report")
                            node.remove();
                            temp_report = document.createElement('div');
                            temp_report.id = "temp_report";
                            temp_report.appendChild(document.createTextNode(chosen.value+" ˚"+chosen.unit));
                            temp_block.appendChild(temp_report);
                        }
                    }
                }

            temp_report = document.createElement('div');
            temp_report.id = "temp_report";
            temp_report.appendChild(document.createTextNode(chosen.value+" ˚"+chosen.unit));
            temp_block.appendChild(temp_report);
            

            
        myforecast = document.createElement('div');
        myforecast.classList.add("myforecast");
        document.body.appendChild(myforecast);

            forecast_title = document.createElement('div');
            forecast_title.classList.add("forecast_title");
            forecast_title.innerHTML = "9-day Forecast";
            myforecast.appendChild(forecast_title);
            
            const forecastBox = forecast_data.weatherForecast;
            current_icon_img.src = "https://www.hko.gov.hk/images/HKOWxIconOutline/pic" + current_data.icon[0] + ".png";

            while(myforecast.secondChild) {myforecast.removeChild(myforecast.secondChild)}
            forecastBox.forEach((item) => {
                forecast_block = document.createElement("div");
                forecast_block.classList.add("forecast_block");
                myforecast.appendChild(forecast_block);

                    forecast_img = document.createElement("img");
                    forecast_img.classList.add("forecast_img");
                    forecast_img.src ="https://www.hko.gov.hk/images/HKOWxIconOutline/pic" + item.ForecastIcon + ".png";
                    forecast_block.appendChild(forecast_img);

                    forecast_date = document.createElement("div");
                    forecast_date.classList.add("forecast_date");
                    forecast_date.appendChild(document.createTextNode(item.forecastDate.slice(item.forecastDate.length - 2, item.forecastDate.length) + "/" + item.forecastDate.slice(
                        item.forecastDate.length - 4,item.forecastDate.length-2)));
                    forecast_block.appendChild(forecast_date);

                    forecast_dayofweek = document.createElement("div");
                    forecast_dayofweek.classList.add("forecast_dayofweek");
                    forecast_dayofweek.appendChild(document.createTextNode(item.week));
                    forecast_block.appendChild(forecast_dayofweek);

                    forecast_temp = document.createElement("div");
                    forecast_temp.classList.add("forecast_temp");
                    forecast_temp.appendChild(document.createTextNode(item.forecastMintemp.value + " ~ " + item.forecastMaxtemp.value));
                    forecast_block.appendChild(forecast_temp);

                    forecast_humidity = document.createElement("div");
                    forecast_humidity.classList.add("forecast_humidity");
                    forecast_humidity.appendChild(document.createTextNode(item.forecastMinrh.value + "%" + " ~ " + item.forecastMaxrh.value + "%"));
                    forecast_block.appendChild(forecast_humidity);

            });
    
}

window.onload = function () {
    //Creation of elements. By default, it is fired when the entire page loads, including its content (images, CSS, scripts, etc.
    render();
  };

