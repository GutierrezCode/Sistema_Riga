import React, { useState, useEffect, useRef } from "react";
import { classNames } from "primereact/utils";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Toolbar } from "primereact/toolbar";
import { InputTextarea } from "primereact/inputtextarea";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import "primeflex/primeflex.css";
import "./EmpresaStyle.css";
import "primeicons/primeicons.css";
import { Tag } from "primereact/tag";
import Header from "../Header/Header";
import Dashboard from "../Header/Head";
import apiClient from "../Security/apiClient";

const URL = import.meta.env.VITE_BACKEND_URL;

export default function ProductsDemo() {
  let emptyProduct = {
    idEmpresa: "",
    ruc: "",
    razonSocial: "",
    direccion: "",
    idDistrito: "",
    idProvincia: "",
    idDepartamento: "",
  };

  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [products, setProducts] = useState([]);
  const [productDialog, setProductDialog] = useState(false);
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [product, setProduct] = useState(emptyProduct);
  const [selectedProducts, setSelectedProducts] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [globalFilter, setGlobalFilter] = useState(null);
  const toast = useRef(null);
  const dt = useRef(null);

  useEffect(() => {
    fetchDepartamentos();
    fetchEmpresas();
  }, []);

  const fetchDepartamentos = async () => {
    try {
      const data = await apiClient.get(`${URL}/departamento`);
      setDepartamentos(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProvincias = async (departamentoId) => {
    try {
      setProduct((prevProduct) => ({
        ...prevProduct,
        idDepartamento: departamentoId,
      }));
      setProvincias([]);
      setDistritos([]);

      const data = await apiClient.get(
        `${URL}/provincia/departamento/${departamentoId}`
      );
      setProvincias(data);
    } catch (error) {
      console.error("Error al obtener provincias:", error);
    }
  };

  const fetchDistritos = async (idProvincia) => {
    try {
      setProduct((prevProduct) => ({ ...prevProduct, idProvincia }));
      setDistritos([]);
      const data = await apiClient.get(
        `${URL}/distrito/provincia/${idProvincia}`
      );
      setDistritos(data);
    } catch (error) {
      console.error("Error al obtener distritos:", error);
    }
  };

  const fetchEmpresas = async () => {
    try {
      const data = await apiClient.get(`${URL}/empresa`);
      setProducts(data);
    } catch (error) {
      console.error("Error al obtener empresas:", error);
    }
  };

  const saveProduct = async () => {
    setSubmitted(true);

    if (product.razonSocial.trim()) {
      let _products = [...products];
      let _product = { ...product };
      const method = _product.idEmpresa ? "PUT" : "POST";
      const url = _product.idEmpresa
        ? `${URL}/empresa/${_product.idEmpresa}`
        : `${URL}/empresa`;

      try {
        if (method === "PUT") {
          await apiClient.put(url, _product);
        } else {
          await apiClient.post(url, _product);
        }

        fetchEmpresas();
        setProducts(_products);
        setProductDialog(false);
        setProduct(emptyProduct);
      } catch (error) {
        console.error("Error al guardar la empresa:", error);
      }
    }
  };

  const handleEdit = async (empresa) => {
    setProduct({ ...empresa });
    setProductDialog(true);

    const { idDistrito } = empresa;
    try {
      const provinciaData = await apiClient.get(
        `${URL}/provincia/distrito/${idDistrito}`
      );
      const provinciaNombre = provinciaData.nombreProvincia;
      const departamentoData = await apiClient.get(
        `${URL}/departamento/provincia/${provinciaNombre}`
      );

      setProduct((prevFormData) => ({
        ...prevFormData,
        idProvincia: provinciaData.idProvincia,
        idDepartamento: departamentoData.idDepartamento,
      }));

      await fetchProvincias(departamentoData.idDepartamento);
      await fetchDistritos(provinciaData.idProvincia);
    } catch (error) {
      console.error("Error al obtener provincias o departamentos:", error);
    }
  };

  const editProduct = async (product) => {
    handleEdit(product);
  };

  const confirmDeleteProduct = (product) => {
    setProduct(product);
    setDeleteProductDialog(true);
  };

  const deleteProduct = async () => {
    if (product.idEmpresa) {
      try {
        await apiClient.del(`${URL}/empresa/${product.idEmpresa}`);
        setDeleteProductDialog(false);
        setProduct(emptyProduct);
        fetchEmpresas();
        toast.current.show({
          severity: "error",
          summary: "Successful",
          detail: "Empresa Eliminada",
          life: 3000,
        });
      } catch (error) {
        console.error("Error al eliminar la empresa:", error);
      }
    } else if (
      selectedProducts &&
      selectedProducts.length > 0 &&
      selectedProducts.length < 5
    ) {
      try {
        const deletePromises = selectedProducts.map((prod) =>
          apiClient.del(`${URL}/empresa/${prod.idEmpresa}`)
        );
        await Promise.all(deletePromises);
        setDeleteProductDialog(false);
        setSelectedProducts(null);
        fetchEmpresas();
        toast.current.show({
          severity: "error",
          summary: "Successful",
          detail: "Empresas Eliminadas",
          life: 3000,
        });
      } catch (error) {
        console.error("Error al eliminar las empresas:", error);
      }
    } else {
      console.error(
        "No se puede eliminar la empresa. ID de empresa no encontrado."
      );
    }
  };

  const activateEmpresa = async (id) => {
    try {
      await apiClient.patch(`${URL}/empresa/${id}`);
      fetchEmpresas();
      toast.current.show({
        severity: "success",
        summary: "Successful",
        detail: "Empresa Activada",
        life: 3000,
      });
    } catch (error) {
      console.error("Error al activar la empresa:", error);
    }
  };

  const activateSelectedEmpresas = async () => {
    if (selectedProducts && selectedProducts.length > 0) {
      try {
        const activatePromises = selectedProducts.map((prod) =>
          apiClient.patch(`${URL}/empresa/${prod.idEmpresa}`)
        );
        await Promise.all(activatePromises);
        setSelectedProducts(null);
        fetchEmpresas();
        toast.current.show({
          severity: "success",
          summary: "Successful",
          detail: "Empresas Activadas",
          life: 3000,
        });
      } catch (error) {
        console.error("Error al activar las empresas:", error);
      }
    }
  };

  const openNew = () => {
    setProduct(emptyProduct);
    setSubmitted(false);
    setProductDialog(true);
  };

  const hideDialog = () => {
    setSubmitted(false);
    setProductDialog(false);
  };

  const hideDeleteProductDialog = () => {
    setDeleteProductDialog(false);
  };

  const onInputChange = (e, name) => {
    const val = (e.target && e.target.value) || "";
    let _product = { ...product };
    _product[`${name}`] = val;
    setProduct(_product);
  };

  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          label="New"
          icon="pi pi-plus"
          severity="info"
          onClick={openNew}
        />
        <Button
          label="Delete"
          icon="pi pi-trash"
          className="p-button-danger"
          onClick={() => confirmDeleteProduct(selectedProducts)}
          disabled={!selectedProducts || !selectedProducts.length}
        />
        <Button
          label="Activate"
          icon="pi pi-check"
          className="p-button-success"
          onClick={activateSelectedEmpresas}
          disabled={!selectedProducts || !selectedProducts.length}
        />
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <Button
        label="Export"
        icon="pi pi-upload"
        className="p-button-help"
        onClick={() => dt.current.exportCSV()}
      />
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex">
        <Button
          icon="pi pi-pencil"
          rounded
          outlined
          className="mr-3"
          onClick={() => editProduct(rowData)}
        />
        <Button
          icon={rowData.estadoEmpresa === "1" ? "pi pi-trash" : "pi pi-check"}
          rounded
          outlined
          severity={rowData.estadoEmpresa === "1" ? "danger" : "success"}
          onClick={() => {
            if (rowData.estadoEmpresa === "1") {
              confirmDeleteProduct(rowData);
            } else {
              activateEmpresa(rowData.idEmpresa);
            }
          }}
        />
      </div>
    );
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0">Manage Empresas</h4>
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText
          type="search"
          onInput={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search..."
        />
      </IconField>
    </div>
  );
  const productDialogFooter = (
    <React.Fragment>
      <Button label="Cancel" icon="pi pi-times" outlined onClick={hideDialog} />
      <Button label="Save" icon="pi pi-check" onClick={saveProduct} />
    </React.Fragment>
  );
  const deleteProductDialogFooter = (
    <React.Fragment>
      <Button
        label="No"
        icon="pi pi-times"
        outlined
        onClick={hideDeleteProductDialog}
      />
      <Button
        label="Yes"
        icon="pi pi-check"
        severity="danger"
        onClick={deleteProduct}
      />
    </React.Fragment>
  );
  const rowClassName = (rowData) => {
    return {
      "eliminated-row": rowData.estadoEmpresa === "0",
    };
  };

  const statusBodyTemplate = (rowData) => {
    const severity = getSeverity(rowData.estadoEmpresa);
    return (
      <Tag value={severity === "success"} severity={severity}>
        {severity === "success" ? "Habilitado" : "Deshabilitado"}
      </Tag>
    );
  };

  const getSeverity = (estadoEmpresa) => {
    switch (estadoEmpresa) {
      case "1":
      case "secondary":
        return "success";
      case "0":
        return "danger";
      default:
        return null;
    }
  };

  return (
    <div>
      <Dashboard />
      <div className="flex">
        <div className="w-1/4">
          <Header />
        </div>
        <div className="col-12 xl:col-10">
          <div className="w-3/4 p-4">
            <Toast ref={toast} />

            <div className="card">
              <Toolbar
                className="mb-4"
                left={leftToolbarTemplate}
                right={rightToolbarTemplate}
              ></Toolbar>

              <DataTable
                ref={dt}
                value={products}
                selection={selectedProducts}
                onSelectionChange={(e) => {
                  setSelectedProducts(e.value);
                }}
                dataKey="idEmpresa"
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25]}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} empresas"
                globalFilter={globalFilter}
                header={header}
                rowClassName={rowClassName}
                responsiveLayout="scroll"
              >
                <Column selectionMode="multiple" exportable={false} />
                <Column
                  field="idEmpresa"
                  header="ID"
                  sortable
                  style={{ minWidth: "6rem" }}
                />
                <Column
                  field="ruc"
                  header="RUC"
                  sortable
                  style={{ minWidth: "8rem" }}
                />
                <Column
                  field="razonSocial"
                  header="Razón Social"
                  sortable
                  style={{ minWidth: "12rem" }}
                />
                <Column
                  field="direccion"
                  header="Dirección"
                  sortable
                  style={{ minWidth: "12rem" }}
                />
                <Column
                  field="idDistrito"
                  header="Distrito"
                  sortable
                  style={{ minWidth: "10rem" }}
                />
                <Column
                  field="estadoEmpresa"
                  header="EstadoEmpresa"
                  body={statusBodyTemplate}
                  sortable
                  style={{ minWidth: "12rem" }}
                ></Column>
                <Column
                  body={actionBodyTemplate}
                  exportable={false}
                  style={{ minWidth: "8rem" }}
                />
              </DataTable>
            </div>

            <Dialog
              visible={productDialog}
              style={{ width: "32rem" }}
              breakpoints={{ "960px": "75vw", "641px": "90vw" }}
              header="Detalles de Empresa"
              modal
              className="p-fluid"
              footer={productDialogFooter}
              onHide={hideDialog}
            >
              <div className="field">
                <label htmlFor="ruc" className="font-bold">
                  RUC
                </label>
                <InputText
                  id="ruc"
                  value={product.ruc}
                  keyfilter="int"
                  maxLength="11"
                  onChange={(e) => onInputChange(e, "ruc")}
                  required
                  autoFocus
                  className={classNames({
                    "p-invalid": submitted && !product.ruc,
                  })}
                />
                {submitted && !product.ruc && (
                  <small className="p-error">RUC es requerido.</small>
                )}
              </div>
              <div className="field">
                <label htmlFor="razonSocial" className="font-bold">
                  Razón Social
                </label>
                <InputText
                  id="razonSocial"
                  value={product.razonSocial}
                  onChange={(e) => onInputChange(e, "razonSocial")}
                  required
                  autoFocus
                  className={classNames({
                    "p-invalid": submitted && !product.razonSocial,
                  })}
                />
                {submitted && !product.razonSocial && (
                  <small className="p-error">Razón Social es requerido.</small>
                )}
              </div>
              <div className="field">
                <label htmlFor="direccion" className="font-bold">
                  Dirección
                </label>
                <InputTextarea
                  id="direccion"
                  value={product.direccion}
                  onChange={(e) => onInputChange(e, "direccion")}
                  required
                  rows={3}
                  cols={20}
                />
                {submitted && !product.direccion && (
                  <small className="p-error">Dirección es requerido.</small>
                )}
              </div>
              <div className="formgrid grid">
                <div className="field col">
                  <label htmlFor="idDepartamento" className="font-bold">
                    Departamento
                  </label>
                  <Dropdown
                    id="departamentoDropdown"
                    value={product.idDepartamento}
                    options={departamentos}
                    onChange={(e) => fetchProvincias(e.value)}
                    optionLabel="nombreDepartamento"
                    optionValue="idDepartamento"
                    placeholder="Seleccione un Departamento"
                  />
                </div>
                <div className="field col">
                  <label htmlFor="idProvincia" className="font-bold">
                    Provincia
                  </label>

                  <Dropdown
                    id="idProvincia"
                    value={product.idProvincia}
                    options={provincias}
                    onChange={(e) => fetchDistritos(e.value)}
                    optionLabel="nombreProvincia"
                    optionValue="idProvincia"
                    placeholder="Seleccione un Provincia"
                  />
                </div>
                <div className="field col">
                  <label htmlFor="idDistrito" className="font-bold">
                    Distrito
                  </label>
                  <Dropdown
                    id="idDistrito"
                    value={product.idDistrito}
                    options={distritos}
                    onChange={(e) => onInputChange(e, "idDistrito")}
                    optionLabel="nombreDistrito"
                    optionValue="idDistrito"
                    placeholder="Seleccione un Distrito"
                  />
                </div>
              </div>
            </Dialog>

            <Dialog
              visible={deleteProductDialog}
              style={{ width: "32rem" }}
              breakpoints={{ "960px": "75vw", "641px": "90vw" }}
              header="Confirm"
              modal
              footer={deleteProductDialogFooter}
              onHide={hideDeleteProductDialog}
            >
              <div className="confirmation-content">
                <i
                  className="pi pi-exclamation-triangle mr-3"
                  style={{ fontSize: "2rem" }}
                />
                {product && (
                  <span>
                    Are you sure you want to delete <b>{product.razonSocial}</b>
                    ?
                  </span>
                )}
              </div>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
