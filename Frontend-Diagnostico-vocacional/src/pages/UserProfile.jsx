import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getUserById, updateUser } from "../api/user";
import { changePassword } from "../api/auth";
import {
  User,
  MapPin,
  GraduationCap,
  Edit3,
  Save,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  Lock,
} from "lucide-react";

const UserProfile = () => {
  const { token, user: currentUser } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const isCurrentUser = currentUser?.id === id;
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'moderator';

  // Cargar los datos del usuario al montar el componente
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getUserById(id, token);
        const formattedData = { ...data };
        if (formattedData.fechaNacimiento) {
          const date = new Date(formattedData.fechaNacimiento);
          const year = date.getUTCFullYear();
          const month = String(date.getUTCMonth() + 1).padStart(2, "0");
          const day = String(date.getUTCDate()).padStart(2, "0");
          formattedData.fechaNacimiento = `${year}-${month}-${day}`;
        }
        setUser(data);
        setForm(formattedData);
      } catch (err) {
        console.error("Error al obtener usuario", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, token]);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Manejar cambios en el formulario de contraseña
  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    setPasswordError("");
    setPasswordSuccess(false);
  };

  // Guardar cambios en el perfil del usuario
  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSave = { ...form };
      if (dataToSave.fechaNacimiento) {
        dataToSave.fechaNacimiento = new Date(dataToSave.fechaNacimiento);
      }
      await updateUser(id, dataToSave, token);
      setUser(form);
      setEditing(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Error al actualizar usuario", err);
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  // Manejar el envío del formulario de contraseña
  const handlePasswordSave = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (!isAdmin && !passwordForm.currentPassword) {
      setPasswordError("Debes ingresar la contraseña actual.");
      return;
    }

    setPasswordSaving(true);
    setPasswordError("");
    setPasswordSuccess(false);

    try {
      const targetId = isAdmin ? id : undefined;
      const passwordData = { newPassword: passwordForm.newPassword };
      if (!isAdmin) {
        passwordData.currentPassword = passwordForm.currentPassword;
      }

      await changePassword(targetId, passwordData, token);
      setPasswordSuccess(true);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordSaving(false);
    }
  };

  // Redirigir al perfil del usuario encontrado
  const handleVerResultados = () => {
    navigate(`/perfil/${id}/resultados`);
  };

  // Renderizar el componente
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full opacity-20 animate-pulse"></div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              Cargando perfil
            </h3>
            <p className="text-sm text-gray-600">
              Obteniendo información del usuario...
            </p>
          </div>
        </div>
      </div>
    );
  }
// Si hay un error, mostrar un mensaje de error
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Usuario no encontrado
          </h2>
          <p className="text-gray-600 mb-4">
            No se pudo cargar la información del usuario solicitado
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-2 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }
// Si no hay resultados, mostrar un mensaje de "Sin Resultados"
// Renderizar el perfil del usuario
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {showSuccess && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
            <CheckCircle className="w-5 h-5" />
            <span>Perfil actualizado exitosamente</span>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 relative overflow-hidden">
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                    <User className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="text-white">
                  <h1 className="text-2xl font-bold mb-1">
                    {user.name} {user.apellido}
                  </h1>
                  <p className="text-blue-100 flex items-center space-x-2">
                    <span>{user.email}</span>
                    {user.unidadEducativa && (
                      <>
                        <span>•</span>
                        <span>{user.unidadEducativa}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-0">
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-white/20 backdrop-blur-sm text-white px-6 py-2.5 rounded-xl hover:bg-white/30 transition-all duration-200 flex items-center justify-center space-x-2 border border-white/30"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span className="font-medium">Editar Perfil</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-green-500 text-white px-6 py-2.5 rounded-xl hover:bg-green-600 disabled:opacity-50 transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Guardar</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setForm(user);
                        setEditing(false);
                      }}
                      className="bg-white/20 backdrop-blur-sm text-white px-6 py-2.5 rounded-xl hover:bg-white/30 transition-all duration-200 flex items-center justify-center space-x-2 border border-white/30"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancelar</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Información Personal
                  </h3>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: "Cédula", name: "cedula", disabled: true },
                  { label: "Nombre", name: "name" },
                  { label: "Segundo Nombre", name: "secondName" },
                  { label: "Apellido", name: "apellido" },
                  { label: "Segundo Apellido", name: "segundoApellido" },
                  {
                    label: "Nacionalidad",
                    name: "nacionalidad",
                    type: "select",
                    options: ["V", "E"],
                  },
                  { label: "Edad", name: "edad" },
                  {
                    label: "Sexo",
                    name: "sexo",
                    type: "select",
                    options: ["Hombre", "Mujer"],
                  },
                  {
                    label: "Fecha de Nacimiento",
                    name: "fechaNacimiento",
                    type: "date",
                  },
                  { label: "Teléfono", name: "telefono" },
                  { label: "Correo", name: "email", type: "email" },
                ].map(({ label, name, type = "text", disabled, options }) => (
                  <div key={name} className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      {label}
                    </label>
                    {type === "select" ? (
                      <select
                        name={name}
                        value={form[name] || ""}
                        onChange={handleChange}
                        disabled={!editing}
                        className={`w-full px-4 py-2 border-2 rounded-xl text-sm ${
                          !editing
                            ? "bg-gray-100 text-gray-500"
                            : "bg-white hover:border-blue-400 focus:border-blue-500"
                        }`}
                      >
                        <option value="">Selecciona una opción</option>
                        {options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={type}
                        name={name}
                        value={form[name] || ""}
                        onChange={handleChange}
                        disabled={disabled || !editing}
                        className={`w-full px-4 py-2 border-2 rounded-xl text-sm ${
                          disabled
                            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                            : !editing
                            ? "bg-gray-50"
                            : "bg-white hover:border-blue-400 focus:border-blue-500"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/80 rounded-2xl shadow-xl border overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Ubicación</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {["estado", "municipio", "parroquia"].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-semibold text-gray-700 capitalize">
                      {field}
                    </label>
                    <input
                      type="text"
                      name={field}
                      value={form[field] || ""}
                      onChange={handleChange}
                      disabled={!editing}
                      className={`w-full px-4 py-2 border-2 rounded-xl text-sm ${
                        !editing
                          ? "bg-gray-50"
                          : "bg-white hover:border-green-400 focus:border-green-500"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/80 rounded-2xl shadow-xl border overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Educación</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { label: "Unidad Educativa", name: "unidadEducativa" },
                  {
                    label: "Código Unidad Educativa",
                    name: "codigoUnidadEducativa",
                  },
                ].map(({ label, name }) => (
                  <div key={name}>
                    <label className="block text-sm font-semibold text-gray-700">
                      {label}
                    </label>
                    <input
                      type="text"
                      name={name}
                      value={form[name] || ""}
                      onChange={handleChange}
                      disabled={!editing}
                      className={`w-full px-4 py-2 border-2 rounded-xl text-sm ${
                        !editing
                          ? "bg-gray-50"
                          : "bg-white hover:border-purple-400 focus:border-purple-500"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white/80 rounded-2xl shadow-xl border overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Cambiar Contraseña
                  </h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {!isAdmin && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Contraseña Actual
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-2 border-2 rounded-xl text-sm"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border-2 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border-2 rounded-xl text-sm"
                  />
                </div>
                {passwordError && (
                  <div className="text-sm text-red-500 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="text-sm text-green-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Contraseña actualizada con éxito.
                  </div>
                )}
                <button
                  onClick={handlePasswordSave}
                  disabled={passwordSaving}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  {passwordSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Cambiando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Guardar Nueva Contraseña</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white/80 rounded-2xl shadow-xl border overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-center">
            <div className="text-white mb-4">
              <h4 className="text-lg font-semibold">
                ¿Listo para ver tus resultados?
              </h4>
              <p className="text-white/80 text-sm">
                Revisa el análisis completo de tu evaluación
              </p>
            </div>
            <button
              onClick={handleVerResultados}
              className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-50 hover:scale-105 transition-all duration-200 flex items-center space-x-2 mx-auto"
            >
              <Eye className="w-5 h-5" />
              <span>Ver Resultados del Test</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;