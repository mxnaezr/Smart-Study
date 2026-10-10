# Running StudyFlow with Oracle Database

This branch switches the Spring Boot backend from MySQL to Oracle. The existing JPA entities and application features are intended to remain in place.

## 1. Create a dedicated Oracle schema user

Connect to your local Oracle pluggable database using SQL Developer as an administrator. Use the correct PDB/service for your installation (often `XEPDB1` on Oracle XE, or `FREEPDB1` on Oracle Database Free).

Create a dedicated application user. Choose your own strong password and do not commit it to Git:

```sql
CREATE USER studyflow IDENTIFIED BY "choose-a-strong-local-password";
GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE VIEW TO studyflow;
ALTER USER studyflow QUOTA UNLIMITED ON USERS;
```

If the user already exists, do not run `CREATE USER` again. Grant the required privileges to the existing user instead. Your tables should be created inside the `studyflow` schema.

## 2. Create the tables

Open `database/oracle_schema.sql` in SQL Developer, connect as `STUDYFLOW` to the correct PDB, and run the script. Run it only in a new/empty schema: it creates tables and is not an import of old MySQL data.

The backend also has Hibernate schema update enabled for local development. The SQL script is provided so you can create and inspect the schema explicitly. If Hibernate reports a mapping/schema mismatch, stop and resolve it rather than deleting tables or data.

## 3. Configure backend environment variables

The backend reads database settings from environment variables so credentials are not stored in source control.

Windows PowerShell example (use your actual Oracle service name and the password you chose):

```powershell
$env:DB_URL = "jdbc:oracle:thin:@//localhost:1521/XEPDB1"
$env:DB_USERNAME = "studyflow"
$env:DB_PASSWORD = "your-local-password"
$env:JWT_SECRET = "replace-with-a-long-random-secret"
```

Set the existing app's mail and Gemini variables too if you use those features:

```powershell
$env:MAIL_USERNAME = "your-email"
$env:MAIL_PASSWORD = "your-app-password"
$env:GEMINI_API_KEY = "your-gemini-api-key"
```

Then open `studyflow-backend/studyflow-backend` and run:

```powershell
.\mvnw.cmd spring-boot:run
```

If your installation uses `FREEPDB1` or another service name, change `DB_URL` accordingly. Confirm the service name in SQL Developer or your Oracle listener configuration.

## Notes

- Java 17 is configured in the Maven project; the Oracle JDBC driver is `ojdbc11`.
- The default URL assumes Oracle is listening on localhost port 1521 and the service is `XEPDB1`. Change it if your local setup differs.
- This is a database-engine switch, not a recovery of records lost with the old MySQL installation.
- Never put database, mail, JWT, or API secrets in committed files.
- The schema script and backend have not been tested against your local Oracle installation from this environment.
