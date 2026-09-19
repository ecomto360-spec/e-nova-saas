const fs = require('fs');

const loginPath = 'src/pages/auth/Login.tsx';
let loginContent = fs.readFileSync(loginPath, 'utf8');

loginContent = loginContent.replace(
  /} else {(\s+)setError\("Erreur lors de la connexion avec Google."\);/,
  `} else if (err.code === "auth/popup-blocked") {
        setError("La fenêtre de connexion a été bloquée. Veuillez autoriser les pop-ups ou ouvrir l'application dans un nouvel onglet.");
      } else {
        setError("Erreur lors de la connexion avec Google.");`
);

fs.writeFileSync(loginPath, loginContent);


const registerPath = 'src/pages/auth/Register.tsx';
let registerContent = fs.readFileSync(registerPath, 'utf8');

registerContent = registerContent.replace(
  /} else {(\s+)setError\("Erreur lors de la connexion avec Google."\);/,
  `} else if (err.code === "auth/popup-blocked") {
        setError("La fenêtre de connexion a été bloquée. Veuillez autoriser les pop-ups ou ouvrir l'application dans un nouvel onglet.");
      } else {
        setError("Erreur lors de la connexion avec Google.");`
);

fs.writeFileSync(registerPath, registerContent);

console.log("Updated auth error handling");
