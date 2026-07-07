import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests
  app.use(express.json());

  // Initialize the Gemini client server-side only
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || "MOCK_KEY", // fallback to prevent crash on require if missing
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Special chat endpoint mapping to Gemini and receiving real-time hospital inventory context
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, products, movements } = req.body;

      if (!apiKey) {
        return res.status(500).json({ 
          error: "Clé d'API manquante. Veuillez configurer GEMINI_API_KEY dans vos secrets de projet." 
        });
      }

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Format des messages invalide" });
      }

      const latestMessage = messages[messages.length - 1];
      if (!latestMessage || !latestMessage.content) {
        return res.status(400).json({ error: "Message vide ou invalide" });
      }

      // Format accurate real-time inventory contexts to bypass general model hallucination
      const formattedProducts = (products || []).map((p: any) => 
        `- ID: ${p.id} | Nom: ${p.name} | Catégorie: ${p.category} | Stock: ${p.stock} unités | Seuil minimal: ${p.minStock} | Statut: ${p.status} | Date de péremption: ${p.expiration} | Emplacement: ${p.location}`
      ).join('\n');

      const formattedMovements = (movements || []).slice(0, 15).map((m: any) =>
        `- Date: ${m.date} | Produit: ${m.productName} | Type: ${m.type} | Quantité: ${m.quantity} | Destination: ${m.destination} | Signé par: ${m.performedBy}`
      ).join('\n');

      const systemInstruction = `Tu es "Stock Assistant IA", un assistant pharmacologique et logistique hospitalier virtuel super intelligent de l'Hôpital Central.
Ton rôle est d'aider le personnel de l'hôpital (pharmaciens, administrateurs, directeurs, magasiniers) à gérer le stock de médicaments et matériel médical à l'aide des données en temps réel que nous t'envoyons.

Voici l'état actuel et exact du stock de l'hôpital à analyser :
=== PRODUITS EN STOCK ===
${formattedProducts || "Aucun produit en stock actuellement."}

=== HISTORIQUE RÉCENT DES MOUVEMENTS DE STOCK (15 derniers) ===
${formattedMovements || "Aucun mouvement de stock enregistré."}

=== CONSIGNES COMPORTEMENTALES ===
1. Réponds EXCLUSIVEMENT en Français.
2. Sois concis, professionnel, précis et chaleureux. Ne fais pas de bavardage générique inutile.
3. Utilise les données exactes de l'inventaire ci-dessus pour répondre aux questions. Sois factuel : si on te demande quel produit est en rupture de stock, cherche ceux qui ont 0 unité dans le texte ci-dessus et cite-les précisément.
4. Pour les prédictions logistiques ou d'alertes de rupture de stock à 7 jours, base-toi intelligemment sur les statuts "CRITIQUE", "ATTENTION", "PÉREMPTION" ou "RUPTURE" des produits ci-dessus et propose des réapprovisionnements judicieux (ex: commander immédiatement si le seuil minimal est atteint).
5. Ne suggère jamais de données extravagantes non formulées dans l'inventaire. Cite toujours précisément les noms des médicaments exacts du stock.
6. Propose des solutions constructives : par exemple, s'il y a un déficit d'un certain antibiotique, indique la référence exacte et la quantité préconisée d'unités de sécurité à commander pour combler le seuil minimal.`;

      // Translate chat messages to @google/genai format
      const formattedContents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Call Gemini 3.5 Flash
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2, // low temperature for precise factual insights
        }
      });

      const reply = response.text || "Désolé, je n'ai pas pu formuler une analyse précise.";
      return res.json({ reply });

    } catch (err: any) {
      console.error("Erreur serveur API Chat:", err);
      return res.status(550).json({ 
        error: `Une erreur est survenue lors de la communication avec l'assistant de stock : ${err.message || err}` 
      });
    }
  });

  // Vite integration as middleware depending on environment
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting development environment with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting production environment serving static build folder...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur prêt et démarré sur : http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Fatal exception during server boot:", error);
});
