
import express from 'express'
import csrf from 'csurf'
import cookieParser from 'cookie-parser'
import usuarioRoutes from './routes/usuarioRoutes.js'
import propiedadesRoutes from './routes/propiedadesRoutes.js'
import appRoutes from './routes/appRoutes.js'
import apiRoutes from './routes/apiRoutes.js'
import db from './config/db.js'


// Crear app
const app= express()

//Habilitar lectura de formularios
app.use(express.urlencoded({extended: true}))

//Habilitar Cookie Parser
app.use(cookieParser())

// habilitar Cookie Parser
app.use(csrf({cookie: true}))

//Conexion a la base de datos

try {
    await db.authenticate();
    db.sync()
    console.log('Conexión Correcta a la Base de datos')

} catch (error){
    console.log(error)
}

// Habilitar pug

app.set('view engine', 'pug')
app.set('views', './views')

// Carpeta pública
app.use( express.static('public') )


// Routing
app.use('/', appRoutes)
app.use('/auth', usuarioRoutes)
app.use('/', propiedadesRoutes)
app.use('/api', apiRoutes)



//Definir un puerto y arrancar el proyecto
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`El servidor está funcionando en el puerto ${port}`)
})