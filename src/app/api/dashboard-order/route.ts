import clientPromise from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const database = client.db("stockmanagementdb");
    const products = await database
      .collection("ordercollection")
      ?.find({})
      ?.toArray();
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
    const { _id, products } = body;

    const client = await clientPromise;
    const database = client.db("stockmanagementdb");
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
        const itemUpdate = allProducts?.find(
          (x) => x._id?.toString?.() === product._id
        );

        // ลด quantity ของสินค้า
        const updatedQuantity = itemUpdate?.quantity + product.quantity;

        bulkOps.push({
          updateOne: {
            filter: { _id: new ObjectId(product._id) },
            update: { $set: { quantity: updatedQuantity } },
            upsert: false, // ถ้าไม่พบเอกสารก็จะไม่สร้างใหม่
          },
        });
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
        const updatedQuantity = itemUpdate?.quantity + mainList?.quantity;

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

    const result = await database
      .collection("ordercollection")
      .deleteOne({ _id: new ObjectId(_id) });
    if (result.deletedCount === 0) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
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
