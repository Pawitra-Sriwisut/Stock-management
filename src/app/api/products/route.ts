import clientPromise from "@/src/lib/mongodb";
import { MongoClient, ObjectId } from "mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const database = client.db("stockmanagementdb");
    const products = await database
      .collection("productcollection")
      .aggregate([
        {
          $lookup: {
            from: "masterartistcollection", // collection ที่จะเชื่อมโยง
            localField: "artistId", // ฟิลด์ใน productCollection
            foreignField: "_id", // ฟิลด์ใน artistCollection
            as: "artistInfo", // ชื่อฟิลด์ที่ได้จากการเชื่อมโยง
          },
        },
        {
          $lookup: {
            from: "producttypecollection", // collection ที่จะเชื่อมโยง
            localField: "productTypeId", // ฟิลด์ใน productCollection
            foreignField: "_id", // ฟิลด์ใน producttypecollection
            as: "productTypeInfo", // ชื่อฟิลด์ที่ได้จากการเชื่อมโยง
          },
        },
        {
          $lookup: {
            from: "promotioncollection", // ชื่อ collection ที่จะ join
            localField: "_id", // ฟิลด์ใน productcollection ที่ใช้ในการ match
            foreignField: "productList", // ฟิลด์ใน promotioncollection ที่เก็บ productId (คือ productList)
            as: "promotionInfo", // ตั้งชื่อ field ที่จะเก็บข้อมูลจาก promotioncollection
          },
        },
        {
          $unwind: "$artistInfo", // แปลงข้อมูลจาก array ของ artist ให้เป็น object
        },
        {
          $unwind: "$productTypeInfo", // แปลงข้อมูลจาก array ของ artist ให้เป็น object
        },
        {
          $unwind: {
            path: "$promotionInfo", // แปลงข้อมูลจาก array ของ promotionInfo ให้เป็น object
            preserveNullAndEmptyArrays: true, // ถ้าไม่มีการจับคู่ ก็ไม่เกิด error
          },
        },
        {
          $addFields: {
            sortOrder: {
              $cond: {
                if: { $eq: ["$quantity", 0] }, // ตรวจสอบถ้าสต็อกเป็น 0
                then: 1, // ถ้าใช่ ให้มีค่าเป็น 1
                else: 0, // ถ้าไม่ใช่ ให้มีค่าเป็น 0
              },
            },
          },
        },
        {
          $sort: {
            sortOrder: 1,
            "productTypeInfo.name": 1,
            "artistInfo.name": 1,
            productName: 1,
          },
        },
        {
          $project: {
            productName: 1, // เลือกฟิลด์ที่ต้องการ
            price: 1,
            quantity: 1,
            imageURL: 1,
            artistId: 1,
            productTypeId: 1,
            productList: 1,
            artistName: "$artistInfo.name", // เปลี่ยนจาก artistId เป็น artistName
            productTypeName: "$productTypeInfo.name", // เปลี่ยนจาก productTypeId เป็น productTypeName
            promotionId: "$promotionInfo._id", // ดึง promotionId จาก promotionInfo
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

export async function POST(req: any) {
  try {
    const body = await req.json();
    const { productName } = body;
    const client = await clientPromise;
    const database = client.db("stockmanagementdb");
    const collection = database.collection("productcollection");
    const existingUser = await collection.findOne({ productName });
    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "Product Name already exists" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const result = await collection.insertOne({
      ...body,
      artistId: new ObjectId(body.artistId),
      productTypeId: new ObjectId(body.productTypeId),
    });
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
      .collection("productcollection")
      .deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
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
    const {
      productName,
      id,
      price,
      quantity,
      productTypeId,
      productList,
      artistId,
      imageURL,
    } = body;
    const client = await clientPromise;
    const database = client.db("stockmanagementdb");
    const collection = database.collection("productcollection");
    const existingUser = await collection.findOne({ productName });
    if (existingUser?.productName === productName) {
      const result = await collection.updateOne(
        { _id: new ObjectId(id) }, // เงื่อนไขการค้นหาเอกสารที่ต้องการอัพเดท
        {
          $set: {
            price,
            quantity,
            productList,
            productTypeId: new ObjectId(productTypeId),
            artistId: new ObjectId(artistId),
            imageURL,
          }, // ค่าที่จะอัพเดท
        }
      );
      return new Response(JSON.stringify(result), { status: 200 });
    }
    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "Product Name already exists" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const result = await collection.updateOne(
      { _id: new ObjectId(id) }, // เงื่อนไขการค้นหาเอกสารที่ต้องการอัพเดท
      {
        $set: {
          productName,
          price,
          quantity,
          productList,
          productTypeId: new ObjectId(productTypeId),
          artistId: new ObjectId(artistId),
          imageURL,
        }, // ค่าที่จะอัพเดท
      }
    );
    // เช็คว่าอัพเดทได้สำเร็จหรือไม่
    if (result.matchedCount === 0) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
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
