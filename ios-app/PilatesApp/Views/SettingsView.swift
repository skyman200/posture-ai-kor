//
//  SettingsView.swift
//  PilatesApp
//
//  Created on 2025-01-04.
//

import SwiftUI

struct SettingsView: View {
    @State private var availableEquipment: Set<String> = []
    @State private var language: String = "한국어"
    @State private var showExportSheet = false
    
    var body: some View {
        NavigationView {
            Form {
                Section("장비 설정") {
                    EquipmentAvailabilityView(availableEquipment: $availableEquipment)
                }
                
                Section("언어") {
                    Picker("언어", selection: $language) {
                        Text("한국어").tag("한국어")
                        Text("English").tag("English")
                    }
                }
                
                Section("데이터") {
                    Button(action: exportData) {
                        HStack {
                            Image(systemName: "square.and.arrow.up")
                            Text("운동 프로그램 내보내기")
                        }
                    }
                    
                    Button(role: .destructive, action: resetData) {
                        HStack {
                            Image(systemName: "trash")
                            Text("데이터 초기화")
                        }
                    }
                }
                
                Section("앱 정보") {
                    HStack {
                        Text("버전")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                    
                    Link(destination: URL(string: "https://github.com/skyman200/posture-ai-kor")!) {
                        HStack {
                            Text("GitHub")
                            Spacer()
                            Image(systemName: "arrow.up.right.square")
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
            .navigationTitle("설정")
            .navigationBarTitleDisplayMode(.large)
            .onAppear {
                loadSettings()
            }
            .sheet(isPresented: $showExportSheet) {
                ExportView()
            }
        }
    }
    
    private func loadSettings() {
        if let data = UserDefaults.standard.data(forKey: "availableEquipment"),
           let equipment = try? JSONDecoder().decode([String].self, from: data) {
            availableEquipment = Set(equipment)
        }
    }
    
    private func exportData() {
        showExportSheet = true
    }
    
    private func resetData() {
        // 데이터 초기화 로직
    }
}

struct EquipmentAvailabilityView: View {
    @Binding var availableEquipment: Set<String>
    
    let allEquipment = ["매트", "리포머", "캐딜락", "체어", "바렐"]
    
    var body: some View {
        ForEach(allEquipment, id: \.self) { equipment in
            Toggle(equipment, isOn: Binding(
                get: { availableEquipment.contains(equipment) },
                set: { isOn in
                    if isOn {
                        availableEquipment.insert(equipment)
                    } else {
                        availableEquipment.remove(equipment)
                    }
                    saveSettings()
                }
            ))
        }
    }
    
    private func saveSettings() {
        if let data = try? JSONEncoder().encode(Array(availableEquipment)) {
            UserDefaults.standard.set(data, forKey: "availableEquipment")
        }
    }
}

struct ExportView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var exportFormat: String = "PDF"
    
    var body: some View {
        NavigationView {
            Form {
                Section("내보내기 형식") {
                    Picker("형식", selection: $exportFormat) {
                        Text("PDF").tag("PDF")
                        Text("JSON").tag("JSON")
                        Text("CSV").tag("CSV")
                    }
                }
                
                Section {
                    Button(action: performExport) {
                        HStack {
                            Image(systemName: "square.and.arrow.up")
                            Text("내보내기")
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
            }
            .navigationTitle("내보내기")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("취소") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private func performExport() {
        // 내보내기 로직 구현
        dismiss()
    }
}










