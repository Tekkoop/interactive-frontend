// The API Key provided is restricted to JSFiddle website
// Get your own API Key on https://myprojects.geoapify.com
var myAPIKey = "aa96c3b9b2974aa0a95f944d091c6dfe";

var bounds = {
    // Kota Kinubalu
    lat1: 5.9749,
    lon1: 116.0724,
    lat2: 5.0,
    lon2: 116.0,
};

var map = new maplibregl.Map({
    container: "my-map",
    style: `https://maps.geoapify.com/v1/styles/osm-bright-grey/style.json?apiKey=${myAPIKey}`,
});
map.addControl(new maplibregl.NavigationControl());

map.on("load", () => {
    map.fitBounds(
        [
            [bounds.lon1, bounds.lat1],
            [bounds.lon2, bounds.lat2],
        ], {
            padding: 50,
        }
    );

    // getting an icon from Geoapify Icons API
    // Explicitly set scaleFactor=2 in the call
    // and {pixelRatio: scale} to get better
    // Marker Icon quality with MapLibre GL
    var scale = 2;
    map.loadImage(
        `https://api.geoapify.com/v1/icon/?type=awesome&color=%23e25b00&size=large&icon=subway&iconSize=large&noWhiteCircle&scaleFactor=${scale}&apiKey=${myAPIKey}`,
        function(error, image) {
            if (error) throw error;
            map.addImage("subway-station-pin", image, {
                pixelRatio: scale,
            }); //38x55px, shadow adds 5px
        }
    );

    var type = "catering.cafe";

    // getting cafes for the given boundary (number of results limited by 100)
    var placesUrl = `https://api.geoapify.com/v2/places?categories=public_transport.subway&filter=rect:${bounds.lon1},${bounds.lat1},${bounds.lon2},${bounds.lat2}&limit=100&apiKey=${myAPIKey}`;

    fetch(placesUrl)
        .then((response) => response.json())
        .then((places) => {
            showGeoJSONPoints(places, type);
        });
});

function showGeoJSONPoints(geojson, id) {
    var layerId = `${id}-layer`;

    if (map.getSource(id)) {
        // romove first the old one
        map.removeLayer(layerId);
        map.removeSource(id);
    }

    map.addSource(id, {
        type: "geojson",
        data: geojson,
    });

    map.addLayer({
        id: layerId,
        type: "symbol",
        source: id,
        layout: {
            "icon-image": "subway-station-pin",
            "icon-anchor": "bottom",
            "icon-offset": [0, 5],
            "icon-allow-overlap": true,
        },
    });

    map.on("click", layerId, function(e) {
        var coordinates = e.features[0].geometry.coordinates.slice();
        var name = e.features[0].properties.name;

        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new maplibregl.Popup({
                anchor: "bottom",
                offset: [0, -50],
            })
            .setLngLat(coordinates)
            .setText(name)
            .addTo(map);
    });

    // Change the cursor to a pointer when the mouse is over the places layer.
    map.on("mouseenter", layerId, function() {
        map.getCanvas().style.cursor = "pointer";
    });

    // Change it back to a pointer when it leaves.
    map.on("mouseleave", layerId, function() {
        map.getCanvas().style.cursor = "";
    });
}