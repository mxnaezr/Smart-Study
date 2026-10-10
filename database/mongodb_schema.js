// Smart Study / StudyFlow MongoDB collection setup
// Target: mongosh, MongoDB 6.0+
// Run with: mongosh "<your-mongodb-connection-string>" mongodb_schema.js
// This defines document validation and indexes; it does not migrate MySQL data.
// MongoDB is document-oriented: references below are ObjectIds, not SQL foreign keys.

const database = db.getSiblingDB("studyflow_db");

const definitions = [
  {
    name: "users",
    validator: { $jsonSchema: { bsonType: "object", required: ["name","email","password","emailVerified","createdAt","updatedAt"], properties: {
      _id: { bsonType: "objectId" }, name: { bsonType: "string", maxLength: 100 },
      email: { bsonType: "string", maxLength: 150 }, password: { bsonType: "string", maxLength: 255 },
      gender: { bsonType: ["string","null"], maxLength: 10 }, dateOfBirth: { bsonType: ["date","null"] },
      phoneNumber: { bsonType: ["string","null"], maxLength: 30 }, profileImage: { bsonType: ["string","null"], maxLength: 500 },
      emailVerified: { bsonType: "bool" }, verificationCode: { bsonType: ["string","null"], maxLength: 6 },
      verificationCodeExpiry: { bsonType: ["date","null"] }, createdAt: { bsonType: "date" }, updatedAt: { bsonType: "date" }
    } } }
  },
  {
    name: "subjects",
    validator: { $jsonSchema: { bsonType: "object", required: ["name","userId"], properties: {
      _id: { bsonType: "objectId" }, name: { bsonType: "string", maxLength: 100 },
      description: { bsonType: ["string","null"], maxLength: 500 }, color: { bsonType: ["string","null"], maxLength: 50 },
      userId: { bsonType: "objectId" }
    } } }
  },
  {
    name: "study_sessions",
    validator: { $jsonSchema: { bsonType: "object", required: ["startTime","durationMinutes","userId","subjectId"], properties: {
      _id: { bsonType: "objectId" }, startTime: { bsonType: "date" }, endTime: { bsonType: ["date","null"] },
      durationMinutes: { bsonType: "int" }, notes: { bsonType: ["string","null"] },
      userId: { bsonType: "objectId" }, subjectId: { bsonType: "objectId" }
    } } }
  },
  {
    name: "study_goals",
    validator: { $jsonSchema: { bsonType: "object", required: ["title","targetMinutes","currentMinutes","startDate","endDate","completed","userId"], properties: {
      _id: { bsonType: "objectId" }, title: { bsonType: "string", maxLength: 200 },
      targetMinutes: { bsonType: "int" }, currentMinutes: { bsonType: "int" },
      startDate: { bsonType: "date" }, endDate: { bsonType: "date" }, completed: { bsonType: "bool" },
      userId: { bsonType: "objectId" }, subjectId: { bsonType: ["objectId","null"] }
    } } }
  },
  {
    name: "friendships",
    validator: { $jsonSchema: { bsonType: "object", required: ["requesterId","addresseeId","status","createdAt","updatedAt"], properties: {
      _id: { bsonType: "objectId" }, requesterId: { bsonType: "objectId" }, addresseeId: { bsonType: "objectId" },
      status: { enum: ["PENDING","ACCEPTED","DECLINED"] }, createdAt: { bsonType: "date" }, updatedAt: { bsonType: "date" }
    } } }
  },
  {
    name: "study_call_logs",
    validator: { $jsonSchema: { bsonType: "object", required: ["userId","roomCode","joinedAt","callType"], properties: {
      _id: { bsonType: "objectId" }, userId: { bsonType: "objectId" }, roomCode: { bsonType: "string", maxLength: 80 },
      joinedAt: { bsonType: "date" }, leftAt: { bsonType: ["date","null"] },
      durationSeconds: { bsonType: ["long","int","null"] }, callType: { bsonType: "string", maxLength: 20 }
    } } }
  },
  {
    name: "email_verifications",
    validator: { $jsonSchema: { bsonType: "object", required: ["email","code","expiresAt","used"], properties: {
      _id: { bsonType: "objectId" }, email: { bsonType: "string", maxLength: 150 },
      code: { bsonType: "string", maxLength: 6 }, expiresAt: { bsonType: "date" }, used: { bsonType: "bool" }
    } } }
  }
];

for (const definition of definitions) {
  if (!database.getCollectionNames().includes(definition.name)) {
    database.createCollection(definition.name, { validator: definition.validator, validationLevel: "strict", validationAction: "error" });
  } else {
    database.runCommand({ collMod: definition.name, validator: definition.validator, validationLevel: "strict", validationAction: "error" });
  }
}

database.users.createIndex({ email: 1 }, { unique: true, name: "uk_users_email" });
database.subjects.createIndex({ userId: 1 }, { name: "idx_subjects_user_id" });
database.study_sessions.createIndex({ userId: 1 }, { name: "idx_study_sessions_user_id" });
database.study_sessions.createIndex({ subjectId: 1 }, { name: "idx_study_sessions_subject_id" });
database.study_sessions.createIndex({ startTime: 1 }, { name: "idx_study_sessions_start_time" });
database.study_goals.createIndex({ userId: 1 }, { name: "idx_study_goals_user_id" });
database.study_goals.createIndex({ subjectId: 1 }, { name: "idx_study_goals_subject_id" });
database.friendships.createIndex({ requesterId: 1, addresseeId: 1 }, { unique: true, name: "uk_friendship_pair" });
database.friendships.createIndex({ addresseeId: 1 }, { name: "idx_friendships_addressee_id" });
database.study_call_logs.createIndex({ userId: 1 }, { name: "idx_study_call_logs_user_id" });
database.study_call_logs.createIndex({ roomCode: 1 }, { name: "idx_study_call_logs_room_code" });
database.email_verifications.createIndex({ email: 1 }, { name: "idx_email_verifications_email" });
database.email_verifications.createIndex({ expiresAt: 1 }, { name: "idx_email_verifications_expires_at" });

print("StudyFlow MongoDB collections and indexes are ready in " + database.getName());
