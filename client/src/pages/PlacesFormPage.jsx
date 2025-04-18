
import PhotosUploader from "../PhotosUploader.jsx";
import Perks from "../Perks.jsx";
import { useEffect, useState } from "react";
import axios from "axios";
import AccountNav from "../AccountNav";
import { Navigate, useParams } from "react-router-dom";

// ✅ Axios config to send cookies
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:4000'; // Adjust according to your backend port

export default function PlacesFormPage() {
  const { id } = useParams();

  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [addedPhotos, setAddedPhotos] = useState([]);
  const [description, setDescription] = useState('');
  const [perks, setPerks] = useState([]);
  const [extraInfo, setExtraInfo] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [maxGuests, setMaxGuests] = useState(1);
  const [price, setPrice] = useState(100);
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    if (!id) return;
    axios.get(`http://localhost:4000/api/places/${id}`).then(response => {
      const data = response.data;
      setTitle(data.title);
      setAddress(data.address);
      setAddedPhotos(data.photos);
      setDescription(data.description);
      setPerks(data.perks);
      setExtraInfo(data.extraInfo);
      setCheckIn(data.checkIn);
      setCheckOut(data.checkOut);
      setMaxGuests(data.maxGuests);
      setPrice(data.price);
    });
  }, [id]);

  function inputHeader(text) {
    return <h2 className="text-2xl mt-4">{text}</h2>;
  }

  function inputDescription(text) {
    return <p className="text-gray-500 text-sm">{text}</p>;
  }

  function preInput(header, description) {
    return (
      <>
        {inputHeader(header)}
        {inputDescription(description)}
      </>
    );
  }
  async function savePlace(ev) {
    ev.preventDefault();
    const placeData = {
      title,
      address,
      addedPhotos,
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
      price,
    };
  
    try {
      let response;
      if (id) {
        // Update existing place
        response = await axios.put('http://localhost:4000/api/places', { id, ...placeData }, { withCredentials: true });
      } else {
        // Create new place
        response = await axios.post('http://localhost:4000/api/places', placeData, { withCredentials: true });
      }
  
      console.log('Save place response:', response);
  
      // Only redirect if the response is successful
      if (response.status === 200) {
        // setRedirect(true);
      } else {
        console.error('Unexpected response:', response);
      }
    } catch (err) {
      console.error('Error saving place:', err);
    }
  }
  
  
  
  // async function savePlace(ev) {
  //   ev.preventDefault();
  //   const placeData = {
  //     title,
  //     address,
  //     addedPhotos,
  //     description,
  //     perks,
  //     extraInfo,
  //     checkIn,
  //     checkOut,
  //     maxGuests,
  //     price,
  //   };

  //   try {
  //     if (id) {
  //       // Update existing place
  //       await axios.put('/api/places', { id, ...placeData });
  //     } else {
  //       // Create new place
  //       await axios.post('/api/places', placeData);
  //     }
  //     setRedirect(true);
  //   } catch (err) {
  //     console.error('Error saving place:', err);
  //   }
  // }

  if (redirect) {
    return <Navigate to={'/account/places'} />;
  }

  return (
    <div>
      <AccountNav />
      <form onSubmit={savePlace}>
        {preInput('Title', 'Title for your place. Should be short and catchy like an ad')}
        <input
          type="text"
          value={title}
          onChange={ev => setTitle(ev.target.value)}
          placeholder="Example: My lovely apartment"
        />

        {preInput('Address', 'Address of this place')}
        <input
          type="text"
          value={address}
          onChange={ev => setAddress(ev.target.value)}
          placeholder="Address"
        />

        {preInput('Photos', 'More = better')}
        <PhotosUploader addedPhotos={addedPhotos} onChange={setAddedPhotos} />

        {preInput('Description', 'Describe your place')}
        <textarea
          value={description}
          onChange={ev => setDescription(ev.target.value)}
        />

        {preInput('Perks', 'Select all the perks of your place')}
        <div className="grid mt-2 gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Perks selected={perks} onChange={setPerks} />
        </div>

        {preInput('Extra Info', 'House rules, etc')}
        <textarea
          value={extraInfo}
          onChange={ev => setExtraInfo(ev.target.value)}
        />

        {preInput('Check-in & Check-out times', 'Add check-in and check-out times')}
        <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
          <div>
            <h3 className="mt-2 -mb-1">Check-in time</h3>
            <input
              type="text"
              value={checkIn}
              onChange={ev => setCheckIn(ev.target.value)}
              placeholder="14"
            />
          </div>
          <div>
            <h3 className="mt-2 -mb-1">Check-out time</h3>
            <input
              type="text"
              value={checkOut}
              onChange={ev => setCheckOut(ev.target.value)}
              placeholder="11"
            />
          </div>
          <div>
            <h3 className="mt-2 -mb-1">Max number of guests</h3>
            <input
              type="number"
              value={maxGuests}
              onChange={ev => setMaxGuests(ev.target.value)}
            />
          </div>
          <div>
            <h3 className="mt-2 -mb-1">Price per night</h3>
            <input
              type="number"
              value={price}
              onChange={ev => setPrice(ev.target.value)}
            />
          </div>
        </div>

        <button className="primary my-4">Save</button>
      </form>
    </div>
  );
}
