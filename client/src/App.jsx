import React, { useState, useEffect } from "react";
import forge from "node-forge";

function App() {
  const BASE_URL = "http://127.0.0.1:3005";
  const [publicKeyFromBackend, setPublicKeyFromBackend] = useState("");
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    (async () => {
      try {
        // Fetch the public key from the backend
        const response = await fetch(`${BASE_URL}/api/public-key`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        setPublicKeyFromBackend(data.key);

        // Any other side effects you want to perform can be added here
        // For example, you can set the initial state for loginForm here
        // setLoginForm({ email: "", password: "" });
      } catch {
        alert("PUBLIC KEY IS NOT FOUND");
      }
    })();
  }, []); // The empty dependency array ensures that this useEffect runs only once when the component mounts

  const encryptAndSendData = async () => {
    // Parse the PEM-encoded public key to an RSA public key object
    const publicKey = forge.pki.publicKeyFromPem(publicKeyFromBackend);

    // Serialize the login form data to JSON
    const loginFormJSON = JSON.stringify(loginForm);

    // Encrypt the JSON string using the public key with RSA-OAEP padding
    const encryptedData = publicKey.encrypt(loginFormJSON, "RSA-OAEP");

    // Encode the encrypted data in base64
    const encodedData = forge.util.encode64(encryptedData);

    // Call the API to send the encrypted data
    await makeUserLogin(encodedData);
  };

  const makeUserLogin = async (encryptedData) => {
    try {
      await fetch(`${BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ encryptedData }),
      });
      alert("LOGIN SUCCESSFUL");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="App">
      {publicKeyFromBackend ? (
        <>
          <h1>React Encrypted Request</h1>
          <div>
            <input
              type="email"
              value={loginForm.email}
              onChange={(e) => {
                const email = e.target.value;
                setLoginForm({ ...loginForm, email });
              }}
            />
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => {
                const password = e.target.value;
                setLoginForm({ ...loginForm, password });
              }}
            />
            <button onClick={encryptAndSendData}>Login</button>
          </div>
        </>
      ) : (
        <h1>NO PUBLIC KEY FOUND</h1>
      )}
    </div>
  );
}

export default App;
