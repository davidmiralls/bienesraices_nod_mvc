import {check, validationResult} from 'express-validator'
import bcrypt from 'bcrypt'

import Usuario from '../models/Usuario.js'
import {generarJWT, generarId} from '../helpers/tokens.js'
import { emailRegistro, emailOlvidePassword} from '../helpers/emails.js'


const formularioLogin = (req,res) => {
    res.render('auth/login', {
       pagina: 'Iniciar Sesión',
       csrfToken: req.csrfToken()
    })
}

const autenticar = async (req,res)=>{
//autenticar
await check('email').isEmail().withMessage('El email es obligatorio').run(req)
await check('password').notEmpty().withMessage('El password es obligatorio').run(req)


let resultado = validationResult(req)
//return res.json(resultado.array())


 //verificar que el resultado esté vacío
 if(!resultado.isEmpty()){
    //errores - ponemos return para garantizar que no se ejecuten más líneas de código
    return res.render('auth/login', {
        pagina: 'Iniciar Sesión',
        errores: resultado.array(),
        csrfToken: req.csrfToken(),
     
     })

}
//extraemos los datos del req.body

const { email, password } = req.body


// comprobar si el usuario existe
const usuario = await Usuario.findOne({ where: { email } })
if (!usuario) {
    return res.render('auth/login', {
        pagina: 'Iniciar Sesión',
        csrfToken: req.csrfToken(),
        errores: [{msg: 'El usuario no existe'}]
     
     })
}
// comprobar si el usuario esta confirmado
if(!usuario.confirmado){
    return res.render('auth/login', {
        pagina: 'Iniciar Sesión',
        csrfToken: req.csrfToken(),
        errores: [{msg: 'Tu cuenta no ha sido confirmada'}]
     })
}

// Revisar el password
if(!usuario.verificarPassword(password)){
    return res.render('auth/login', {
        pagina: 'Iniciar Sesión',
        csrfToken: req.csrfToken(),
        errores: [{msg: 'El password es incorrecto'}]
     })
}

// Autenticar al usuario
const token = generarJWT({id: usuario.id, nombre: usuario.nombre})
console.log(token)
//Almacenar en un cookie
return res.cookie('_token', token, {
    httpOnly: true,
   // secure: true,
   // sameSite: true
}).redirect('/mis-propiedades')

}

const cerrarSesion = (req,res) =>{
return res.clearCookie('_token').status(200).redirect('/auth/login')
}

const formularioRegistro = (req,res) => {


    res.render('auth/registro', {
       pagina: 'Crear Cuenta',
       csrfToken: req.csrfToken()
    })
}

const registrar= async (req, res)=> {

    //validación        
    await check('nombre').notEmpty().withMessage('El nombre no puede estar vacio').run(req)
    await check('email').isEmail().withMessage('No parece un email').run(req)
    await check('password').isLength({min: 6 }).withMessage('El password debe ser de al menos 6 caracteres').run(req)
    await check('password').equals(req.body.password).withMessage('Los passwords no son iguales').run(req)
    

    let resultado = validationResult(req)
    //return res.json(resultado.array())

    //verificar que el resultado esté vacío
    if(!resultado.isEmpty()){
        //errores - ponemos return para garantizar que no se ejecuten más líneas de código
        return res.render('auth/registro', {
            pagina: 'Crear Cuenta',
            errores: resultado.array(),
            csrfToken: req.csrfToken(),
            usuario:{
                nombre: req.body.nombre,
                email: req.body.email
                
            }
         })

    }
    // Extraer los datos
    const {nombre, email, password} = req.body

    //verificar que el usuario no existe
    const existeUsuario = await Usuario.findOne({ where: { email }})
    if(existeUsuario){
        return res.render('auth/registro', {
            pagina: 'Crear Cuenta',
            errores: [{msg: 'El usuario ya está registrado'}],
            csrfToken: req.csrfToken(),
            usuario:{
                nombre: req.body.nombre,
                email: req.body.email
                
            }
        })
    }

   //Almacenar un usuario

   const usuario = await Usuario.create({
    nombre,
    email,
    password,
    token: generarId()

   })

   //Envia email de confirmación

 emailRegistro({
    nombre: usuario.nombre,
    email: usuario.email,
    token: usuario.token
 })


//Mostrar mensaje de confirmación
res.render('templates/mensaje', {
    pagina: 'Cuenta Creada Correctamente',
    mensaje: 'Hemos Enviado un Email de Confirmación, presiona en el enlace'
})

}
//función que comprueba una cuenta

const confirmar = async (req,res) =>{
    const { token } = req.params;

//Verificar si el token es válido
const usuario = await Usuario.findOne({ where: {token}})

if(!usuario){
    return res.render('auth/confirmar-cuenta', {
        pagina: 'Error al confirmar tu cuenta',
        mensaje: 'Hubo un error al confirmar tu cuenta, intenta de nuevo',
        error: true
    })
}


// Confirmar la cuenta

usuario.token = null;
usuario.confirmado= true;
await usuario.save();

res.render('auth/confirmar-cuenta', {
    pagina: 'Cuenta Confirmada',
    mensaje: 'La cuenta se confirmó correctamente'
})

}



const formularioOlvidePassword = (req,res) => {
     res.render('auth/olvide-password', {
         pagina: 'Recupera tu acceso a Bienes Raices',
         csrfToken: req.csrfToken(),
    });
};

const resetPassword = async (req, res)=>{
    //validar formulario
    await check('email').isEmail().withMessage('No parece un email').run(req)
  
    
    let resultado = validationResult(req)
    //return res.json(resultado.array())

    //verificar que el resultado esté vacío
    if(!resultado.isEmpty()){
        //errores - ponemos return para garantizar que no se ejecuten más líneas de código
        
         return res.render('auth/olvide-password', {
            pagina: 'Recupera tu acceso a Bienes Raices',
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
           
         })

    } 
    //buscar el usuario

    const{ email } = req.body

    const usuario= await Usuario.findOne({where: {email}})
    if(!usuario){
          
        return res.render('auth/olvide-password', {
            pagina: 'Recupera tu acceso a Bienes Raices',
            csrfToken: req.csrfToken(),
            errores:[{msg:'El email no pertenece a ningún usuario'}]
         })
    }

  // generar un token y enviar el email
  usuario.token = generarId();
  await usuario.save();
  // enviar un email
    emailOlvidePassword({   
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token
})
//Mostrar mensaje de confirmación
    res.render('templates/mensaje', {
    pagina: 'Reestablece tu Password',
    mensaje: 'Hemos enviado un email con las instrucciones'
})
    

}
const comprobarToken= async (req,res)=>{

    const { token } = req.params;
    const usuario = await Usuario.findOne({where: {token}})
    if(!usuario){
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Restablece tu password',
            mensaje: 'Hubo un error al validad tu información, Intenta de nuevo',
            error: true
        })
    }
    // Mostrar formulario para modificar el password
    res.render('auth/reset-password',{
        pagina: 'Restablece tu Password',
        csrfToken: req.csrfToken()

    } )
}
const nuevoPassword= async (req,res)=>{

    //Validar el password
    await check('password').isLength({min: 6 }).withMessage('El password debe ser de al menos 6 caracteres').run(req)
    let resultado = validationResult(req)
    //return res.json(resultado.array())

    //verificar que el resultado esté vacío
    if(!resultado.isEmpty()){
        //errores - ponemos return para garantizar que no se ejecuten más líneas de código
        return res.render('auth/reset-password', {
            pagina: 'Restablece tu password',
            errores: resultado.array(),
            csrfToken: req.csrfToken(),
         
         })

    }

    const { token } = req.params;
    const { password } = req.body;

    //identificar quien hace el cambio
    const usuario = await Usuario.findOne({where: {token}})
   
    //hashear el nuevo password

    const salt = await bcrypt.genSalt(10)
    usuario.password = await bcrypt.hash(password, salt);
    usuario.token = null;

    await usuario.save();

    res.render('auth/confirmar-cuenta', {
        pagina: 'Password Reestablecido',
        mensaje: 'El Password se guardó correctamente'
    })

}

export {
    formularioLogin,
    autenticar,
    cerrarSesion,
    formularioRegistro,
    registrar,
    confirmar,
    formularioOlvidePassword,
    resetPassword,
    comprobarToken,
    nuevoPassword

    
}
