import clientPromise from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const database = client.db("stockmanagementdb");
    const collection = database.collection("producttypecollection");
    const products = await collection.find({}).toArray();
    return new Response(JSON.stringify(products), { status: 200 });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    // หากเกิดข้อผิดพลาด ให้ส่ง status 500
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req: any) {
  try {
    const body = await req.json();
    const { name } = body;
    const client = await clientPromise;
    const database = client.db("stockmanagementdb");
    const collection = database.collection("producttypecollection");
    const existingUser = await collection.findOne({ name });
    if (existingUser) {
      return new Response(JSON.stringify({ error: "Name already exists" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const result = await collection.insertOne(body);
    return new Response(JSON.stringify(result), { status: 201 });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    // หากเกิดข้อผิดพลาด ให้ส่ง status 500
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(req: any) {
  try {
    const body = await req.json();
    const { id } = body;
    const client = await clientPromise;
    const database = client.db("stockmanagementdb");
    const result = await database
      .collection("producttypecollection")
      .deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    // หากเกิดข้อผิดพลาด ให้ส่ง status 500
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PATCH(req: any) {
  try {
    const body = await req.json();
    const { name, id } = body;
    const client = await clientPromise;
    const database = client.db("stockmanagementdb");
    const collection = database.collection("producttypecollection");
    const existingUser = await collection.findOne({ name });
    if (existingUser?.name === name) {
      return new Response(JSON.stringify({ success: "Update Success" }), {
        status: 200,
      });
    }
    if (existingUser) {
      return new Response(JSON.stringify({ error: "Name already exists" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const result = await collection.updateOne(
      { _id: new ObjectId(id) }, // เงื่อนไขการค้นหาเอกสารที่ต้องการอัพเดท
      {
        $set: { name }, // ค่าที่จะอัพเดท
      }
    );
    // เช็คว่าอัพเดทได้สำเร็จหรือไม่
    if (result.matchedCount === 0) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    // หากเกิดข้อผิดพลาด ให้ส่ง status 500
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
