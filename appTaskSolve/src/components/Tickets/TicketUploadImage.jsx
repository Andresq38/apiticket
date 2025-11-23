import React from "react";
import { useEffect, useState } from "react";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import { InputLabel } from "@mui/material";
import { FormHelperText } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import { MenuItem } from "@mui/material";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import TicketService from "../../services/TicketService";
import ImageService from "../../services/ImageService";

export function TicketUploadImage() {
  const navigate = useNavigate();
  let formData = new FormData();
  
  // Esquema de validación
  const ticketSchema = yup.object({
    ticket_id: yup
      .number()
      .typeError("Seleccione un tiquete")
      .required("El tiquete es requerido"),
  });
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      ticket_id: "",
      image: "",
    },
    resolver: yupResolver(ticketSchema),
  });

  const [error, setError] = useState("");
  const onError = (errors, e) => console.log(errors, e);
  
  // Lista de tickets
  const [dataTicket, setDataTicket] = useState({});
  const [loadedTicket, setLoadedTicket] = useState(false);
  
  useEffect(() => {
    TicketService.getTickets()
      .then((response) => {
        console.log(response);
        setDataTicket(response.data);
        setLoadedTicket(true);
      })
      .catch((error) => {
        if (error instanceof SyntaxError) {
          console.log(error);
          setError(error);
          setLoadedTicket(false);
          throw new Error("Respuesta no válida del servidor");
        }
      });
  }, []);
  
  const [file, setFile] = useState(null);
  const [fileURL, setFileURL] = useState(null);
  
  function handleChange(e) {
    if (e.target.files) {
      setFileURL(
        URL.createObjectURL(e.target.files[0], e.target.files[0].name)
      );
      setFile(e.target.files[0], e.target.files[0].name);
    }
  }

  // Acción submit
  const onSubmit = (DataForm) => {
    console.log("Formulario:");
    console.log(DataForm);

    try {
      if (ticketSchema.isValid()) {
        // Creamos un FormData para enviar el archivo
        formData.append("imagen", file); // Imagen
        formData.append("id_ticket", DataForm.ticket_id);
        
        // Subir imagen para ticket
        ImageService.createImage(formData)
          .then((response) => {
            console.log(response);
            setError(response.error);
            
            // Respuesta al usuario de creación
            if (response.data != null) {
              toast.success(response.data.message || "Imagen subida exitosamente", {
                duration: 4000,
                position: "top-center",
              });
              // Redirección a la tabla
              return navigate("/ticket-table");
            }
          })
          .catch((error) => {
            if (error instanceof SyntaxError) {
              console.log(error);
              setError(error);
              throw new Error("Respuesta no válida del servidor");
            }
          });
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (error) return <p>Error: {error.message}</p>;
  
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit, onError)} noValidate>
        <Grid container spacing={1}>
          <Grid size={12} sm={12}>
            <Typography variant="h5" gutterBottom>
              Imágenes Tiquete
            </Typography>
          </Grid>

          <Grid size={12} sm={4}>
            <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
              {/* Lista de tickets */}
              {loadedTicket && (
                <Controller
                  name="ticket_id"
                  control={control}
                  render={({ field }) => (
                    <>
                      <InputLabel id="ticket_id">Tiquete</InputLabel>
                      <Select
                        {...field}
                        labelId="ticket_id"
                        label="Tiquete"
                        value={field.value}
                      >
                        {dataTicket &&
                          dataTicket.map((ticket) => (
                            <MenuItem key={ticket.id_ticket} value={ticket.id_ticket}>
                              {ticket.id_ticket} - {ticket.titulo}
                            </MenuItem>
                          ))}
                      </Select>
                    </>
                  )}
                />
              )}
              <FormHelperText sx={{ color: "#d32f2f" }}>
                {errors.ticket_id ? errors.ticket_id.message : " "}
              </FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid size={12} sm={12}>
            <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
              <Controller
                name="image"
                control={control}
                render={({ field }) => (
                  <input type="file" {...field} onChange={handleChange} accept="image/*" />
                )}
              />
              <FormHelperText sx={{ color: "#d32f2f" }}>
                {errors.image ? errors.image.message : " "}
              </FormHelperText>
            </FormControl>
            <img src={fileURL} width={300} alt="preview" />
          </Grid>
          
          <Grid size={12} sm={12}>
            <Button
              type="submit"
              variant="contained"
              color="secondary"
              sx={{ m: 1 }}
            >
              Guardar
            </Button>
          </Grid>
        </Grid>
      </form>
    </>
  );
}
