import { faPenToSquare, faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import { get, post } from "src/api/requests";
import { FirebaseContext } from "src/utils/FirebaseProvider";

export function IndividualProductPage() {
  const navigate = useNavigate();
  const { user } = useContext(FirebaseContext);
  const { id } = useParams();
  const [product, setProduct] = useState<{
    name: string;
    price: number;
    image: string;
    userEmail: string;
    description: string;
  }>();
  const [error, setError] = useState<string>();
  const [hasPermissions, setHasPermissions] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    const fetchProduct = async () => {
      await get(`/api/products/${id}`)
        .then(async (res) => setProduct(await res.json()))
        .catch(() => setError("Product not found"));
    };
    fetchProduct();
  }, []);

  useEffect(() => {
    const findEditPermission = async () => {
      const uid = user?.uid;
      if (uid)
        await get(`/api/users/${uid}`).then(async (res) => {
          const ownedByUser = await res.json().then((data) => {
            const canEdit = data.productList.includes(id);
            setIsSaved(data.savedProducts?.includes(id));
            return canEdit;
          });
          setHasPermissions(ownedByUser);
        });
    };
    findEditPermission();
  }, []);

  const toggleSave = async () => {
    if (!user?.uid) {
      navigate('/login');
      return;
    }
  
    try {
      setIsSaved(prev => !prev);
      const response = await post(`/api/users/${user.uid}/saved-products`, { productId: id });
      if (!response.ok) {
        setIsSaved(prev => !prev);
        throw new Error('Failed to update saved products');
      }
      const userRes = await get(`/api/users/${user.uid}`);
      const userData = await userRes.json();
      setIsSaved(userData.savedProducts.includes(id));
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  return (
    <>
      <Helmet>
        <title>{`${product?.name} - Low-Price Center`}</title>
      </Helmet>
      <main className="w-[80%] max-w-screen-2xl mx-auto m-12">
        <div className="flex justify-between">
          <button
            className="text-lg mb-4 font-inter hover:underline"
            onClick={() => navigate("/products")}
          >
            &larr; Return to Marketplace
          </button>

          {hasPermissions && (
            <button
              className="text-lg mb-4 font-inter hover:underline"
              onClick={() => navigate(`/edit-product/${id}`)}
            >
              Edit Product <FontAwesomeIcon icon={faPenToSquare} />
            </button>
          )}
        </div>
        {/* Error message if product not found */}
        {error && <p className="max-w-[80%] w-full px-3 text-red-800">{error}</p>}
        {/* Display product */}
        {!error && (
          <div className="flex flex-wrap flex-col md:flex-row mb-6 gap-12">
            {/* Image Section */}
            <section className="w-full flex-1 flex justify-center md:h-auto relative">
              <div className="max-h-[32rem] h-[32rem] max-w-[32rem] w-[32rem] relative border-8 border-ucsd-blue">
                <img
                  src={product?.image ? product?.image : "/productImages/product-placeholder.webp"}
                  alt="Product"
                  className="w-full h-full object-cover"
                />
                <button 
                  onClick={toggleSave}
                  className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  <FontAwesomeIcon 
                    icon={isSaved ? faHeartSolid : faHeartRegular} 
                    size="lg" 
                    className={isSaved ? "text-red-500" : "text-gray-700"} 
                  />
                </button>
              </div>
            </section>

            {/* Info Section */}
            <section className="max-w-[100%] md:max-w-[50%] flex-1 flex flex-col">
              <h1 className="pt-2 font-jetbrains text-black font-bold text-4xl break-words">
                {product?.name}
              </h1>

              <hr className="my-6 w-full mx-auto h-0 border-[1px] border-solid border-gray-300" />

              <h2 className="font-inter text-[#35393C] text-base md:text-xl font-normal pb-6">
                USD ${product?.price?.toFixed(2)}
              </h2>
              {product?.description && (
                <div className="bg-[#F5F0E6] p-5 mb-6">
                  <p className="font-inter text-black text-base md:text-xl font-normal break-words">
                    {product.description}
                  </p>
                </div>
              )}
              <div className="mt-0">
                <p className="font-inter text-black text-base md:text-xl font-light">
                  Interested? Contact them here:
                </p>
                <p className="font-inter text-black hover:text-ucsd-darkblue text-base md:text-xl font-medium break-words transition-colors">
                  <a href={`mailto:${product?.userEmail}`}>{product?.userEmail}</a>
                </p>
              </div>
            </section>
          </div>
        )}
      </main>
    </>
  );
}
