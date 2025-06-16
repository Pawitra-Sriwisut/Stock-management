import clientPromise from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const database = client.db("stockmanagementdb");
    const collection = database.collection("eventcollection");
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
    const { name, isMainEvent } = body;
    const client = await clientPromise;
    const database = client.db("stockmanagementdb");
    const collection = database.collection("eventcollection");
    const existingUser = await collection.findOne({ name });
    if (existingUser) {
      return new Response(JSON.stringify({ error: "Name already exists" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const existingMainEvent = await database
      .collection("eventcollection")
      .findOne({ isMainEvent: true });

    const bulkOps: any = [];

    if (!!isMainEvent && existingMainEvent) {
      bulkOps.push({
        updateOne: {
          filter: { _id: new ObjectId(existingMainEvent._id) },
          update: { $set: { isMainEvent: false } },
          upsert: false, // ถ้าไม่พบเอกสารก็จะไม่สร้างใหม่
        },
      });
    }

    bulkOps.push({
      insertOne: body,
    });

    // ตรวจสอบว่า bulkOps มีข้อมูลหรือไม่ก่อนที่จะทำการ bulkWrite
    if (bulkOps.length > 0) {
      await collection.bulkWrite(bulkOps);
    }

    return new Response(JSON.stringify({ success: "เพิ่มสำเร็จ" }), {
      status: 200,
    });
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
      .collection("eventcollection")
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
    const { name, id, isMainEvent } = body;
    const client = await clientPromise;
    const database = client.db("stockmanagementdb");
    const collection = database.collection("eventcollection");

    const existingMainEvent = await database
      .collection("eventcollection")
      .findOne({ isMainEvent: true });

    if (existingMainEvent && existingMainEvent._id !== id) {
      await collection.updateOne(
        { _id: new ObjectId(existingMainEvent._id) }, // เงื่อนไขการค้นหาเอกสารที่ต้องการอัพเดท
        {
          $set: { isMainEvent: false }, // ค่าที่จะอัพเดท
        }
      );
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) }, // เงื่อนไขการค้นหาเอกสารที่ต้องการอัพเดท
      {
        $set: { name, isMainEvent }, // ค่าที่จะอัพเดท
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
