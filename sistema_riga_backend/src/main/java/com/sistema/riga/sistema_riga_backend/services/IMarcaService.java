package com.sistema.riga.sistema_riga_backend.services;

import com.sistema.riga.sistema_riga_backend.models.MarcaModel;

import java.util.List;

public interface IMarcaService {
    List<MarcaModel> getAllMarcas();
    MarcaModel getMarcaById(int id);
    String insertMarca(MarcaModel marcaModel);
    String updateMarca(MarcaModel marcaModel);
    String deleteMarca(int id);
}
