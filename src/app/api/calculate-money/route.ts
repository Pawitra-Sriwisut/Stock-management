import clientPromise from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: any) {
  try {
    const client = await clientPromise;
    const body = await req.json();
    const { artistsData, isDelete } = body;
    const database = client.db("stockmanagementdb");
    const artistCollection = database.collection("artistcollection");

    const bulkOps: any = [];
    const insertList: any = [];

    for (const artist of artistsData) {
      const { artistId, total } = artist;

      if (!artistId || total === undefined) {
        continue; // ข้ามรายการที่ไม่มี artistId หรือ total
      }

      // ตรวจสอบว่า artistId เป็น ObjectId หรือ string
      const artistIdObj =
        artistId instanceof ObjectId ? artistId : new ObjectId(artistId);

      // ค้นหาว่า artistId นี้มีอยู่แล้วหรือไม่
      const existingArtist = await artistCollection.findOne({
        artistId: artistIdObj,
      });

      if (existingArtist) {
        // ถ้ามี artistId นี้อยู่แล้ว ให้ทำการ update
        bulkOps.push({
          updateOne: {
            filter: { _id: existingArtist._id },
            update: { $set: { total: isDelete ? (existingArtist.total - total) : (existingArtist.total + total) } },
            upsert: false, // ถ้าไม่พบเอกสารก็จะไม่สร้างใหม่
          },
        });
      } else {
        // ถ้าไม่มี artistId นี้ ให้ทำการ insert
        insertList.push({
          artistId: artistIdObj,
          total: total,
        });
      }
    }

    // ตรวจสอบว่า bulkOps มีคำสั่งหรือไม่ก่อนที่จะทำการ bulkWrite
    if (bulkOps.length > 0) {
      await artistCollection.bulkWrite(bulkOps);
    }

    // ตรวจสอบว่า insertList มีข้อมูลหรือไม่ก่อนที่จะทำการ insertMany
    if (insertList.length > 0) {
      const result = await artistCollection.insertMany(insertList);
      return new Response(JSON.stringify(result), {
        status: 200,
      });
    }

    return new Response(
      JSON.stringify({ message: "No data to insert or update" }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    // หากเกิดข้อผิดพลาด ให้ส่ง status 500
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
