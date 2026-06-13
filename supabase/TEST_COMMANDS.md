# Commandes de test Supabase

Remplace `YOUR_SUPABASE_URL` et `YOUR_ANON_KEY` par tes vraies valeurs.

## 1. Test SignUp via API

```bash
curl -X POST 'YOUR_SUPABASE_URL/auth/v1/signup' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test-inscription@example.com",
    "password": "TestPassword123!",
    "data": {
      "inscription_type": "formation",
      "prenom": "Test",
      "nom": "Inscription",
      "formule": "echelonne",
      "pays": "France",
      "ville": "Paris"
    }
  }'
```

Réponse attendue : un objet avec `user.id` (même si `session` est null pour confirmation email)

## 2. Test Login via API

```bash
curl -X POST 'YOUR_SUPABASE_URL/auth/v1/token?grant_type=password' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test-inscription@example.com",
    "password": "TestPassword123!"
  }'
```

## 3. Vérifier que le trigger a créé l'élève

Dans Supabase SQL Editor :

```sql
-- Vérifier le dernier user créé
SELECT id, email, raw_user_meta_data, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Vérifier l'élève correspondant
SELECT * FROM eleves ORDER BY date_inscription DESC LIMIT 5;

-- Vérifier l'inscription correspondante
SELECT * FROM inscriptions_formation ORDER BY created_at DESC LIMIT 5;

-- Vérifier la progression
SELECT pe.*, e.email, m.titre
FROM progression_eleve pe
JOIN eleves e ON pe.eleve_id = e.id
JOIN modules_formation m ON pe.module_id = m.id
WHERE e.email = 'test-inscription@example.com';
```

## 4. Vérifier les triggers existants

```sql
SELECT tgname, tgrelid::regclass, tgenabled
FROM pg_trigger
WHERE tgname LIKE 'on_auth%';
```

## 5. Vérifier les logs d'erreur du trigger

```sql
-- Si le trigger échoue, les warnings sont loggés
-- Ils apparaissent dans Supabase Dashboard > Logs > Postgres logs
```

## 6. Test manuel de création élève (sans trigger)

Si le trigger ne fonctionne pas, on peut créer manuellement :

```sql
-- D'abord récupérer l'ID du user
SELECT id, email FROM auth.users WHERE email = 'test@example.com';

-- Puis créer l'inscription et l'élève manuellement
INSERT INTO inscriptions_formation (auth_user_id, prenom, nom, email, formule, statut)
VALUES ('USER_ID_HERE', 'Test', 'Manual', 'test@example.com', 'echelonne', 'actif')
RETURNING id;

INSERT INTO eleves (auth_user_id, inscription_id, prenom, nom, email, formule, statut)
VALUES ('USER_ID_HERE', 'INSCRIPTION_ID_HERE', 'Test', 'Manual', 'test@example.com', 'echelonne', 'actif')
RETURNING id;
```
