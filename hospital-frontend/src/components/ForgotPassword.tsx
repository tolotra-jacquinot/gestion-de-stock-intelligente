import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {

const [email, setEmail] = useState("");
const [loading, setLoading] = useState(false);

const navigate = useNavigate();

const handleSubmit = async (
e: React.FormEvent
) => {

e.preventDefault();

setLoading(true);

try {

await axios.post(
"http://127.0.0.1:8000/api/forgot-password/",
{
email,
}
);

alert(
"Email de réinitialisation envoyé."
);

navigate("/");

}

catch {

alert(
"Erreur lors de l'envoi."
);

}

finally {

setLoading(false);

}

};

return (

<div className="min-h-screen flex items-center justify-center bg-slate-100">

<div className="bg-white rounded-xl shadow p-8 w-[400px]">

<h1 className="text-2xl font-bold text-blue-800 mb-2">

Mot de passe oublié

</h1>

<p className="text-gray-500 mb-5">

Entrez votre email.

</p>

<form
onSubmit={handleSubmit}
className="space-y-4"
>

<input
type="email"
required
value={email}
onChange={(e)=>
setEmail(
e.target.value
)
}
placeholder="email@exemple.com"
className="w-full border rounded p-3"
/>

<button
type="submit"
disabled={loading}
className="w-full bg-blue-800 text-white rounded p-3"
>

{
loading
?
"Envoi..."
:
"Envoyer"
}

</button>

<button
type="button"
onClick={()=>
navigate("/")
}
className="w-full border rounded p-3"
>

Retour

</button>

</form>

</div>

</div>

);

}
