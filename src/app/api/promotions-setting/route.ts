import clientPromise from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const database = client.db("stockmanagementdb");
    const products = await database
      .collection("promotioncollection")
      .aggregate([
        {
          $lookup: {
            from: "productcollection", // collection ที่จะเชื่อมโยง
            localField: "productList", // ฟิลด์ใน promotioncollection
            foreignField: "_id", // ฟิลด์ใน productcollection
            as: "productInfo", // ชื่อฟิลด์ที่ได้จากการเชื่อมโยง
          },
        },
        {
          $lookup: {
            from: "masterpromotioncollection", // collection ที่จะเชื่อมโยง
            localField: "promotionId", // ฟิลด์ใน promotioncollection
            foreignField: "_id", // ฟิลด์ใน masterpromotioncollection
            as: "promotionInfo", // ชื่อฟิลด์ที่ได้จากการเชื่อมโยง
          },
        },
        {
          $project: {
            _id: 1,
            promotionId: 1,
            quantity: 1,
            price: 1,
            productList: 1,
            promotionName: "$promotionInfo.name",
            productListName: {
              $map: {
                input: "$productList", // array ของ product ids
                as: "productId",
                in: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$productInfo",
                        as: "detail",
                        cond: { $eq: ["$$detail._id", "$$productId"] },
                      },
                    },
                    0,
                  ],
                },
              },
            },
            promotionInfo: { $arrayElemAt: ["$promotionInfo", 0] },
          },
        },
        {
          $project: {
            _id: 1,
            promotionId: 1,
            quantity: 1,
            price: 1,
            productList: 1,
            promotionName: "$promotionInfo.name",
            productListName: {
              $map: {
                input: "$productListName",
                as: "item",
                in: "$$item.productName", // ดึงชื่อ product จากผลลัพธ์ที่ match
              },
            },
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
    const client = await clientPromise;
    const database = client.db("stockmanagementdb");
    const collection = database.collection("promotioncollection");
    const result = await collection.insertOne({
      ...body,
      promotionId: new ObjectId(body.promotionId),
      productList: body.productList?.map((x: any) => new ObjectId(x)),
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
      .collection("promotioncollection")
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
    const { id, promotionId, price, quantity, productList } = body;
    const client = await clientPromise;
    const database = client.db("stockmanagementdb");
    const collection = database.collection("promotioncollection");
    const result = await collection.updateOne(
      { _id: new ObjectId(id) }, // เงื่อนไขการค้นหาเอกสารที่ต้องการอัพเดท
      {
        $set: {
          price,
          quantity,
          promotionId: new ObjectId(promotionId),
          productList: productList?.map((x: any) => new ObjectId(x)),
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
