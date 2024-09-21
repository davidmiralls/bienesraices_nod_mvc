import { Dropzone } from 'dropzone'

// Obteniendo el valor del token csrf
const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content')

// referencia al id de la vista agregar-imagen.pug



Dropzone.options.imagen = {
    dictDefaultMessage: 'Sube tus imágenes aquí',
    acceptedFiles:' .png, .jpg, .jpeg',
    maxFilesize: 5,
    maxFiles: 1,
    parallelUploads: 1,
    autoProcessQueue: false,
    addRemoveLinks: true,
    dictRemoveFile: 'Borrar Archivo',
    dictMaxFilesExceeded: 'El límite es un archivo',
    dictFileTooBig: 'El archivo debe pesar menos de 5 mb',
    headers: {
        "CSRF-Token": token
    },
    paramName: 'imagen',
    init: function() {
        const dropzone = this
        const btnPublicar = document.querySelector('#publicar')
        btnPublicar.addEventListener('click', function(){
            dropzone.processQueue()
        })

        dropzone.on('queuecomplete', function(){
            if(dropzone.getActiveFiles().length == 0) {
                window.location.href = '/mis-propiedades'
            }
        })

    }
}