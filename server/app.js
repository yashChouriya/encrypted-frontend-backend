const express = require("express");
const bodyParser = require("body-parser");
const forge = require("node-forge");
const cors = require("cors");
const app = express();
const helmet = require("helmet");
const compression = require("compression");

// Middleware
app.use(compression()); // Compress responses for efficiency
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(cors({ origin: "http://localhost:5173" })); // Enable CORS for specified origin
app.use(
  helmet.hsts({
    maxAge: 31536000, // One year in seconds
    includeSubDomains: true,
    preload: true,
  })
); // Enable HSTS header

// Generate RSA keys
const { privateKey, publicKeyForFrontend } = generateKeyPair();

// Helper function to generate RSA key pair
function generateKeyPair() {
  const keys = forge.pki.rsa.generateKeyPair({ bits: 2048 });
  const privateKey = keys.privateKey;
  const publicKey = keys.publicKey;
  const publicKeyForFrontend = forge.pki.publicKeyToPem(publicKey);
  return { privateKey, publicKey, publicKeyForFrontend };
}

// Helper function to decrypt data
function decryptData(encryptedData) {
  try {
    // Decode the base64-encoded encrypted data
    const decoded = forge.util.decode64(encryptedData);

    // Decrypt the data using the private key with RSA-OAEP padding
    const decryptedBytes = privateKey.decrypt(decoded, "RSA-OAEP");

    return decryptedBytes;
  } catch (error) {
    console.error(error.message);
    return null;
  }
}

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(publicKeyForFrontend);

  // Route for sharing the generated public key with frontend
  app.get("/api/public-key", (req, res) => {
    res.status(201).send({ key: publicKeyForFrontend });
  });

  // Encrypted Route for login
  app.post("/api/login", (req, res) => {
    const encryptedData = req.body.encryptedData;

    // Decrypt the received encrypted data
    const decryptedData_ = decryptData(encryptedData);

    // Check if decryption was successful
    if (!decryptedData_)
      return res.status(400).json({ message: "Invalid Signature" });

    console.log("Decrypted Data:", decryptedData_);

    const { email, password } = JSON.parse(decryptedData_); // Assuming the decryptedData is a JSON string

    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and Password are required for login." });

    // TODO: Implement actual user authentication logic here

    return res.status(201).json({ message: "Login Successfully" });
  });
});
