/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
// Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoiamFtaWVjaG93IiwiYSI6ImNsczI5a2oxeDBqc3QybHBhZDRrYnJoMWoifQ.wLIXAScEoL9dMScxZBBjuw'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/jamiechow/cltxk4kuh01gd01qe78w2akru',  // ****ADD MAP STYLE HERE *****
    center: [-110.594038, 44.6],  // starting point, longitude/latitude
    zoom: 8.2 // starting zoom level
});


/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/
//HINT: Create an empty variable
//      Use the fetch method to access the GeoJSON from your online repository
//      Convert the response to JSON format and then store the response in your new variable

let geojson1;

// Fetch GeoJSON from URL and store response
fetch('https://raw.githubusercontent.com/ggr472yellowstone/ggr472yellowstone.github.io/main/data/FinalBirdDataset.json')
    .then(response => response.json())
    .then(response => {
        geojson1 = response; // Store geojson as variable using URL from fetch response
    });

    map.on('load', () => {

        // Adding trails
        map.addSource('trail', {
          type: 'geojson',
          data: 'https://raw.githubusercontent.com/ggr472yellowstone/ggr472yellowstone.github.io/main/data/Trails.json' // Your URL to your uoft.geojson file
          });
          map.addLayer({
          'id': 'trail-data',
          'type': 'line',
          'source': 'trail',
          'paint': {
            'line-color': '#633423'
            }
        });

         // Adding the border
         map.addSource('extent', {
            type: 'geojson',
            data: 'https://raw.githubusercontent.com/ggr472yellowstone/ggr472yellowstone.github.io/main/data/YellowstoneExtent.json' // Your URL to your uoft.geojson file
            });
            map.addLayer({
            'id': 'extent-data',
            'type': 'line',
            'source': 'extent',
            'paint': {
                'line-color': 'green',
                'line-width': 2
              }
          });
    })

/*--------------------------------------------------------------------
    Step 3: CREATE BOUNDING BOX AND HEXGRID
--------------------------------------------------------------------*/
//HINT: All code to create and view the hexgrid will go inside a map load event handler
//      First create a bounding box around the collision point data then store as a feature collection variable
//      Access and store the bounding box coordinates as an array variable
//      Use bounding box coordinates as argument in the turf hexgrid function

map.on('load', () => {

    let filterYear = ['>=', ['number', ['get', 'year']], 2010];
    let filterSeason = ['!=', ['number', ['get', 'month']], 0];
    let filterBird = ['has', 'species'];

    let bboxgeojson;
    let bbox = turf.envelope(geojson1);

    bboxgeojson = {
        "type" : "FeatureCollection",
        "features": [bbox]
    }

    let bboxcoords = [bbox.geometry.coordinates [0][0][0],
                bbox.geometry.coordinates [0][0][1],
                bbox.geometry.coordinates [0][2][0],
                bbox.geometry.coordinates [0][2][1]];
    let hexgeojson= turf.hexGrid(bboxcoords, 5, {units:'kilometers'});

    let eaglehex = turf.collect(hexgeojson, geojson1, '_id', 'values')

    let maxeagle = 0; // make a "counter" which starts at default from 0

    eaglehex.features.forEach((feature) => {   //for each hexgon feature in eaglehex
        feature.properties.COUNT = feature.properties.values.length     // let the property of "COUNT" equal the number of eagles 
        //  (this is done by measuring the length of the list of the individual eagles)
        if (feature.properties.COUNT > maxeagle) {     // if "COUNT" is greater than the "counter" maxeagle, then:
            maxeagle = feature.properties.COUNT    // maxeagle will take on the value of "COUNT"
        }   // this is done until the max is identified
    }
    );
    
    map.addSource('eagle-geojson', {
        'type': 'geojson',
        data:geojson1
    });

    map.addLayer({
        'id': 'eagle-point',
        'type': 'circle',
        'source': 'eagle-geojson',
        'paint': {
            'circle-radius': 3,
            'circle-color': 'black',
            'circle-opacity': 0.5,
        },
        'filter': ['all', filterYear, filterSeason, filterBird]
    });


    // add fill of hexagons
    map.addSource('hex-source', {
        type:'geojson',
        data:hexgeojson
    })
    map.addLayer(
        {
            'id': 'hex-layer',
            'type': 'fill',
            'source': 'hex-source',
            'paint': {
                'fill-color': [
                    'step',
                    ['get', 'COUNT'],
                    '#2dc4b2', 10,
                    '#3bb3c3', 50,
                    '#669ec4', 200, 
                    '#669ec4', 600, 
                    '#8b88b6', 1000, 
                    '#a2719b'
                ],
                'fill-opacity': [
                    'step',
                    ['get', 'COUNT'],
                    0,
                    1, 0.4
                ]
                }
          }
    )

/*--------------------------------------------------------------------
ADD POP-UP ON CLICK EVENT
--------------------------------------------------------------------*/
map.on('click', 'hex-layer', (e) =>{
    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML('<b>Golden Eagle Count: </b>' + e.features[0].properties.COUNT+ "<br>")
        .addTo(map);
});

/*--------------------------------------------------------------------
CREATE LEGEND INTERACTIVITY
--------------------------------------------------------------------*/

// Create checkbox to activate legend

let legendcheck = document.getElementById('legendcheck');

legendcheck.addEventListener('click', () => {
    if (legendcheck.checked) {
        legendcheck.checked = true;
        legend.style.display = 'block';
    }
    else {
        legend.style.display = "none";
        legendcheck.checked = false;
    }
});

/*--------------------------------------------------------------------
CREATE SLIDER INTERACTIVITY
--------------------------------------------------------------------*/

let slidercheck = document.getElementById('slidercheck');

slidercheck.addEventListener('click', () => {
    if (slidercheck.checked) {
        slidercheck.checked = true;
        sliderbar.style.display = 'block';
    }
    else {
        sliderbar.style.display = "none";
        slidercheck.checked = false;
    }
});

/*--------------------------------------------------------------------
SHOW COllISION MAP BASED ON INTERACTIVITY
--------------------------------------------------------------------*/

// Change map layer display based on check box 
document.getElementById('layercheck').addEventListener('change', (e) => {
    map.setLayoutProperty(
        'eagle-point',
        'visibility',
        e.target.checked ? 'visible' : 'none'
    );
});

// Filter based on slider year
document.getElementById('slider').addEventListener('input', (e) => {
    const year = parseInt(e.target.value);
    // update the map

    filterYear = ['>=', ['number', ['get', 'year']], year];
    map.setFilter('eagle-point', ['all', filterYear, filterSeason, filterBird]);
  
    // update text in the UI
    document.getElementById('active-year').innerText = year;
  });

// Filter summer/winter
document.getElementById('filters').addEventListener('change', (e) => {
const season = e.target.value;
  // update the map filter
  if (season === 'all') {
    filterSeason = ['!=', ['number', ['get', 'month']], 0];
  } else if (season === 'summer') {
    filterSeason = ['match', ['get', 'month'], [4, 5, 6, 7, 8, 9], true, false];
  } else if (season === 'winter') {
    filterSeason = ['match', ['get', 'month'], [10, 11, 12, 1, 2, 3], true, false];
  } else {
    console.log('error');
  }
  map.setFilter('eagle-point', ['all', filterYear, filterSeason, filterBird]);
});

// Add event listener which returns map view to full screen on button click using flyTo method
document.getElementById('returnbutton').addEventListener('click', () => {
    map.flyTo({
      center: [-110.594038, 44.6], // starting position [lng, lat]
      zoom: 8.2, // starting zoom
      essential: true
    });
  });

let birdcheck;
const changeText = document.querySelector("#change-text");
const changeHeader = document.querySelector("#change-header");
const changeImage = document.querySelector("#change-image");
const infobox = document.getElementById('infobox');

document.getElementById("birdfieldset").addEventListener('change',(e) => {   
birdcheck = document.getElementById('bird').value;

    let birdtext;
    let birdheader;
    let birddisplay;
    let birdimage;

    if (birdcheck == 'All'){
        filterBird = ['has', 'species'];
        birddisplay = 'none';
    }
    else if (birdcheck == 'Bucephala albeola'){
        filterBird = ['==', ['get', 'species'], 'Bucephala albeola'];
        birdtext = 'Duck is the common name for numerous species of waterfowl in the family Anatidae. '+
        'Ducks are generally smaller and shorter-necked than swans and geese, which are members of the same family.';
        birdheader = 'Bufflehead Duck - Bucephala Albeola';
        birddisplay = 'block';
        birdimage='images/bird1.jpg'
    }
    else if (birdcheck == 'Mergus merganser'){
        filterBird = ['==', ['get', 'species'], 'Mergus merganser'];
        birdheader = 'Common Merganser - Mergus Merganser';
        birddisplay = 'block'
        birdimage='images/bird2.jpg'
    }
    else if (birdcheck == 'Haliaeetus leucocephalus'){
        filterBird = ['==', ['get', 'species'], 'Haliaeetus leucocephalus'];
        birdheader = 'Bald Eagle - Haliaeetus Leucocephalus';
        birddisplay = 'block'
        birdimage='images/bird3.jpg'
    }
    else if (birdcheck == 'Bubo virginianus'){
        filterBird = ['==', ['get', 'species'], 'Bubo virginianus'];
        birdheader = 'Great Horned Owl - Bubo Virginianus';
        birddisplay = 'block'
        birdimage='images/bird4.jpg'
    }
    else if (birdcheck == 'Leuconotopicus villosus'){
        filterBird = ['==', ['get', 'species'], 'Leuconotopicus villosus'];
        birdheader = 'Hairy Woodpecker - Leuconotopicus Villosus';
        birddisplay = 'block'
        birdimage='images/bird5.jpg'
    }
    else if (birdcheck == 'Myadestes townsendi'){
        filterBird = ['==', ['get', 'species'], 'Myadestes townsendi'];
        birdheader = 'Townsend’s Solitaire - Myadestes Townsendi';
        birddisplay = 'block'
        birdimage='images/bird6.jpg'
    }
    else if (birdcheck == 'Sitta canadensis'){
        filterBird = ['==', ['get', 'species'], 'Sitta canadensis'];
        birdheader = 'Red-breasted Nuthatch - Sitta Canadensis';
        birddisplay = 'block'
        birdimage='images/bird7.jpg'
    }
    else if (birdcheck == 'Gymnorhinus cyanocephalus'){
        filterBird = ['==', ['get', 'species'], 'Gymnorhinus cyanocephalus'];
        birdheader = 'Pinyon Jay - Gymnorhinus Cyanocephalus';
        birddisplay = 'block'
        birdimage='images/bird8.jpg'
    }
    else if (birdcheck == 'Aegolius funereus'){
        filterBird = ['==', ['get', 'species'], 'Aegolius funereus'];
        birdheader = 'Boreal Owl - Aegolius Funereus';
        birddisplay = 'block'
        birdimage='images/bird9.jpg'
    }
    else if (birdcheck == 'Picoides arcticus'){
        filterBird = ['==', ['get', 'species'], 'Picoides arcticus'];
        birdheader = 'Black-backed Woodpecker - Picoides Arcticus';
        birddisplay = 'block'
        birdimage='images/bird10.jpg'
    }
    else if (birdcheck == 'Haemorhous mexicanus'){
        filterBird = ['==', ['get', 'species'], 'Haemorhous mexicanus'];
        birdheader = 'House Finch - Haemorhous Mexicanus';
        birddisplay = 'block'
        birdimage='images/bird11.jpg'
    }
    else if (birdcheck == 'Loxia leucoptera'){
        filterBird = ['==', ['get', 'species'], 'Loxia leucoptera'];
        birdheader = 'White-winged Crossbill - Loxia Leucoptera';
        birddisplay = 'block'
        birdimage='images/bird12.jpg'
    }
    else if (birdcheck == 'Spinus tristis'){
        filterBird = ['==', ['get', 'species'], 'Spinus tristis'];
        birdheader = 'American Goldfinch - Spinus Tristis';
        birddisplay = 'block'
        birdimage='images/bird13.jpg'
    }
    else if (birdcheck == 'Rallus limicola'){
        filterBird = ['==', ['get', 'species'], 'Rallus limicola'];
        birdheader = 'Virginia Rail - Rallus Limicola';
        birddisplay = 'block'
        birdimage='images/bird14.jpg'
    }
    else if (birdcheck == 'Cygnus buccinator'){
        filterBird = ['==', ['get', 'species'], 'Cygnus buccinator'];
        birdheader = 'Trumpeter Swan - Cygnus Buccinator';
        birddisplay = 'block'
        birdimage='images/bird15.jpg'
    }
    else if (birdcheck == 'Aquila chrysaetos'){
        filterBird = ['==', ['get', 'species'], 'Aquila chrysaetos'];
        birdheader = 'Golden Eagle - Aquila Chrysaetos';
        birddisplay = 'block'
        birdimage='images/bird16.jpg'
    }
    else if (birdcheck == 'Gavia immer'){
        filterBird = ['==', ['get', 'species'], 'Gavia immer'];
        birdheader = 'Common Loon - Gavia Immer';
        birddisplay = 'block'
        birdimage='images/bird17.jpg'
    }
    else if (birdcheck == 'Pandion haliaetus'){
        filterBird = ['==', ['get', 'species'], 'Pandion haliaetus'];
        birdheader = 'Ospreys - Pandion Haliaetus';
        birddisplay = 'block'
        birdimage='images/bird18.jpg'
    }
    else if (birdcheck == 'Falco peregrinus'){
        filterBird = ['==', ['get', 'species'], 'Falco peregrinus'];
        birdheader = 'Peregrine Falcons - Falco Peregrinus';
        birddisplay = 'block'
        birdimage='images/bird19.jpg'
    }
    else if (birdcheck == 'Pelecanus erythrorhynchos'){
        filterBird = ['==', ['get', 'species'], 'Pelecanus erythrorhynchos'];
        birdheader = 'American White Pelican - Pelecanus Erythrorhynchos';
        birddisplay = 'block'
        birdimage='images/bird20.jpg'
    }
    else if (birdcheck == 'Larus californicus'){
        filterBird = ['==', ['get', 'species'], 'Larus californicus'];
        birdheader = 'California Gulls - Larus Californicus';
        birddisplay = 'block'
        birdimage='images/bird21.jpg'
    }

    changeImage.src = birdimage
    changeHeader.textContent = birdheader;
    changeText.textContent = birdtext;
    infobox.style.display = birddisplay;

    map.setFilter(
        'eagle-point',
        ['all', filterYear, filterSeason, filterBird]
    )
    });

});
