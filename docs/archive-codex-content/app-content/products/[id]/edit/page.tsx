import { ProductForm } from "@/features/content/products";
export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  return <ProductForm key={id} id={id}/>;
}
