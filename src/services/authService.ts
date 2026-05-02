export async function login(email: string, password: string) {
  const API_URL = process.env.REACT_APP_API_URL;

  const res = await fetch(`${API_URL}/auth/login`, {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      email,
      password
    })

  });

  if (!res.ok) {
    throw new Error("Login incorrecto");
  }

  return res.json();
}