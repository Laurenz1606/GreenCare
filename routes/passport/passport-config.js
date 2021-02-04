const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

function initialize(passport, getUserByEmail, getUserById) {
  const authenticateUser = async (email, password, done) => {
    let user = {}
    await getUserByEmail(email).then(function(result) {
        user = result
    })
    if (user == null) {
      return done(null, false, { message: 'Dieser Benutzer existiert nicht' })
    }
    if (bcrypt.compareSync(password, user.password)) {
      return done(null, user)
    } else {
      return done(null, false, { message: 'Das Passwort ist Falsch' })
    }
  }

  passport.use(new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, authenticateUser))
  passport.serializeUser((user, done) => done(null, user.id))
  passport.deserializeUser((id, done) => {
    return done(null, getUserById(id))
  })
}

module.exports = initialize