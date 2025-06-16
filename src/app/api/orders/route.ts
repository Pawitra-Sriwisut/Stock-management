import clientPromise from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: any) {
  try {
    const body = await req.json();
    const { products } = body;
    const client = await clientPromise;
    const database = client.db("stockmanagementdb");
    const collection = database.collection("ordercollection");
    const productCollection = database.collection("productcollection");

    const bulkOps: any = [];

    const productIds = products.map((p: any) => new ObjectId(p._id));
    const allProducts = await productCollection
      .find({ _id: { $in: productIds } })
      .toArray();

    if (allProducts?.length !== products?.length) {
      return new Response(JSON.stringify({ error: "Product Not Found" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ใช้ for...of แทน forEach เพื่อรองรับ async/await
    for (const product of products ?? []) {
      if (!product.productList) {
        const itemDelete = allProducts?.find(
          (x) => x._id?.toString?.() === product._id
        );
        // ตรวจสอบว่า quantity ที่ต้องการลบมากกว่าหรือเท่ากับ quantity ปัจจุบันหรือไม่
        if (product.quantity > itemDelete?.quantity) {
          return new Response(
            JSON.stringify({ error: "Insufficient quantity to delete" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // ลด quantity ของสินค้า
        const updatedQuantity = itemDelete?.quantity - product.quantity;

        if (updatedQuantity <= 0) {
          bulkOps.push({
            // ถ้าหาก quantity ลดลงเหลือ 0 หรือไม่พอ ให้ลบสินค้าออก
            updateOne: {
              filter: { _id: new ObjectId(product._id) },
              update: { $set: { quantity: 0 } },
              upsert: false, // ถ้าไม่พบเอกสารก็จะไม่สร้างใหม่
            },
          });
        } else {
          // ถ้า quantity ยังไม่หมดให้บันทึกการปรับลด quantity
          bulkOps.push({
            updateOne: {
              filter: { _id: new ObjectId(product._id) },
              update: { $set: { quantity: updatedQuantity } },
              upsert: false, // ถ้าไม่พบเอกสารก็จะไม่สร้างใหม่
            },
          });
        }
      }
    }

    let hasProductList = products
      ?.filter((x: any) => !!x.productList)
      .map((x: any) => {
        return { productList: x.productList, quantity: x.quantity };
      });

    // 1. ดึง _id ทั้งหมดจากทุก productList
    const productIdsHasProductList: string[] = [];

    for (const group of hasProductList ?? []) {
      for (const item of group.productList ?? []) {
        productIdsHasProductList.push(item);
      }
    }

    const objectIds = productIdsHasProductList.map(
      (id: any) => new ObjectId(id)
    );

    const productsFromDB = await productCollection
      .find({ _id: { $in: objectIds } })
      .toArray();

    if (productsFromDB?.length !== productIdsHasProductList?.length) {
      return new Response(JSON.stringify({ error: "Product Not Found" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    for (const mainList of hasProductList ?? []) {
      for (const product of mainList?.productList ?? []) {
        const itemUpdate = productsFromDB?.find(
          (x) => x._id?.toString?.() === product
        );

        // ลด quantity ของสินค้า
        const updatedQuantity = itemUpdate?.quantity - mainList?.quantity;

        bulkOps.push({
          updateOne: {
            filter: { _id: new ObjectId(product) },
            update: { $set: { quantity: updatedQuantity } },
            upsert: false, // ถ้าไม่พบเอกสารก็จะไม่สร้างใหม่
          },
        });
      }
    }

    // ตรวจสอบว่า bulkOps มีข้อมูลหรือไม่ก่อนที่จะทำการ bulkWrite
    if (bulkOps.length > 0) {
      await productCollection.bulkWrite(bulkOps);
    }

    const result = await collection.insertOne(body);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
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
