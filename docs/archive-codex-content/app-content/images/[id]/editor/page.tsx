import { ImageEditor } from "@/features/content/image-editor";
export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  return <ImageEditor key={id} id={id}/>;
}
