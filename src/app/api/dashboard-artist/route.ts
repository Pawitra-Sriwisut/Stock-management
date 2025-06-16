import clientPromise from "@/src/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const database = client.db("stockmanagementdb");
    const products = await database
      .collection("artistcollection")
      .aggregate([
        {
          $lookup: {
            from: "masterartistcollection", // collection ที่จะเชื่อมโยง
            localField: "artistId", // ฟิลด์ใน artistcollection
            foreignField: "_id", // ฟิลด์ใน masterartistcollection
            as: "artistInfo", // ชื่อฟิลด์ที่ได้จากการเชื่อมโยง
          },
        },
        {
          $unwind: "$artistInfo", // แปลงข้อมูลจาก array ของ artist ให้เป็น object
        },
        {
          $project: {
            total: 1, // เลือกฟิลด์ที่ต้องการ
            artistId: 1, // เลือกฟิลด์ที่ต้องการ
            artistName: "$artistInfo.name", // เปลี่ยนจาก artistId เป็น artistName
          },
        },
      ])
      .toArray();
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
