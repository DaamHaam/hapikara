# Comptes et services — Hapikara

Carte des comptes utilisés par le projet, pour reprendre après des mois. **Aucune valeur secrète ici** : seulement où la trouver.

## Code
- GitHub : compte `DaamHaam`, dépôt `DaamHaam/hapikara` (public)
- Branches : voir « Façon de travailler sur ce projet » dans `AGENTS.md`
- Config git spécifique : aucune

## Hébergement
- GitHub Pages : actif, branche `main`, racine — https://daamhaam.github.io/hapikara/
- Connexion : GitHub DaamHaam
- Déploiement : automatique au push sur `main` une fois Pages activé

## Base de données
- aucune

## API et services externes
| Service | Usage | Compte (connexion) | Où est le secret |
|---|---|---|---|
| ChatGPT | Images de référence (`concept-art/`) | à compléter | aucun secret dans le projet |

## Outils des agents
- MCP utiles : navigateur intégré (rendus et captures)
- Notification : `tg-notify` en local (bots partagés, Trousseau `claude-ar-gs-telegram-bot` / `codex-ar-gs-telegram-bot`) ; secrets GitHub `TG_CLAUDE_TOKEN`, `TG_CODEX_TOKEN`, `TG_CHAT_ID` pour `.github/workflows/agents.yml`

## À savoir
- Le moteur vient d'Atlantis (Maksymilian Dendura, MIT) : https://github.com/Noniv/atlantis
- Piste VR future : https://github.com/Noniv/abyssal-garden/pull/1
