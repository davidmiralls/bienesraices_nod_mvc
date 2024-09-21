(function() {
   
    const lat = document.querySelector('#lat').value || 40.4713712;
    const lng = document.querySelector('#lng').value || 0.4742405;
    const mapa = L.map('mapa').setView([lat, lng ], 16);
    let marker;
    
//utilizar provider y geocoder
const geocodeService = L.esri.Geocoding.geocodeService();
// const result= geocodeService.reverse();
// console.log(result);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapa);

    //El pin
    marker = new L.marker([lat,lng], {
        draggable: true,
        autoPan: true
    })
    .addTo(mapa)

    // Detectar el movimiento del pin
    marker.on('moveend', function(e){
        marker = e.target
        const posicion = marker.getLatLng();
        console.log(posicion)
        mapa.panTo(new L.LatLng(posicion.lat, posicion.lng))

         // Obtener la información de las calles al soltar el pin
         geocodeService.reverse().latlng(posicion, 13).run(function(error, resultado){
            
            //console.log(resultado)
            marker.bindPopup(resultado.address.LongLabel)

            //llenar los campos
            document.querySelector('.calle').textContent = resultado?.address?.Address ?? ''
            document.querySelector('#calle').value = resultado?.address?.Address ?? ''
            document.querySelector('#lat').value = resultado?.latlng?.lat ?? ''
            document.querySelector('#lng').value = resultado?.latlng?.lng ?? ''

         })
       
    })
   // marker.bindPopup(res.adress.LongLabel).openPopup()


})()