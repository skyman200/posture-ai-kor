//
//  DataSeeder.swift
//  PilatesApp
//
//  Created on 2025-01-04.
//

import CoreData
import Foundation

struct DataSeeder {
    static func seedInitialData(context: NSManagedObjectContext) {
        // 이미 데이터가 있는지 확인
        let request = NSFetchRequest<MuscleProblem>(entityName: "MuscleProblem")
        if let count = try? context.count(for: request), count > 0 {
            return // 이미 데이터가 있으면 스킵
        }
        
        seedSampleData(context: context)
        
        do {
            try context.save()
        } catch {
            print("Failed to save initial data: \(error)")
        }
    }
    
    static func seedSampleData(context: NSManagedObjectContext) {
        // 장비 생성
        let equipmentTypes = ["매트", "리포머", "캐딜락", "체어", "바렐"]
        var equipmentMap: [String: PilatesEquipment] = [:]
        
        for type in equipmentTypes {
            let equipment = PilatesEquipment(context: context)
            equipment.name = type
            equipment.type = type
            equipmentMap[type] = equipment
        }
        
        // 근육 그룹 생성
        let muscleGroups = [
            ("상부 경추/목", "목"),
            ("어깨/상체", "상체"),
            ("코어/복부", "코어"),
            ("척추/등", "등"),
            ("골반/고관절", "골반"),
            ("하지", "하지")
        ]
        
        var muscleGroupMap: [String: MuscleGroup] = [:]
        
        for (name, category) in muscleGroups {
            let group = MuscleGroup(context: context)
            group.name = name
            group.category = category
            muscleGroupMap[name] = group
        }
        
        // 필라테스 데이터 정의
        let pilatesData: [(problem: String, category: String, description: String, exercises: [String: [String]])] = [
            ("목 굴곡근 약화", "상부 경추/목", "목 굴곡근이 약해 전방두 자세가 발생할 수 있습니다.", [
                "매트": ["Neck Pull", "Roll-Up"],
                "리포머": ["Short Box - Round Back"],
                "캐딜락": ["Roll Down Bar"],
                "체어": ["Swan Prep"],
                "바렐": ["Back Extension"]
            ]),
            ("목 신전근 긴장", "상부 경추/목", "목 신전근이 과도하게 긴장되어 있습니다.", [
                "매트": ["Roll-Up", "Spine Stretch Forward"],
                "리포머": ["Neck Stretch on Box"],
                "캐딜락": ["Tower - Arm Springs"],
                "체어": ["Tricep Dips"],
                "바렐": ["Chest Stretch"]
            ]),
            ("상부승모근 과긴장", "상부 경추/목", "상부승모근이 과도하게 활성화되어 어깨가 올라갑니다.", [
                "매트": ["Arm Circles", "Swimming Prep"],
                "리포머": ["Rowing - From Chest"],
                "캐딜락": ["Arm Springs - Chest Expansion"],
                "체어": ["Tricep Press"],
                "바렐": ["Side Stretch Over"]
            ]),
            ("전방어깨자세", "어깨/상체", "어깨가 앞으로 돌출된 자세입니다.", [
                "매트": ["Swan Dive", "T-Raise"],
                "리포머": ["Backstroke", "Pulling Straps"],
                "캐딜락": ["Push Through Bar"],
                "체어": ["Push Down - Front"],
                "바렐": ["Chest Expansion"]
            ]),
            ("어깨안정근 약화", "어깨/상체", "어깨를 안정시키는 근육이 약합니다.", [
                "매트": ["Plank to Pike", "Side Plank"],
                "리포머": ["Long Stretch Series"],
                "캐딜락": ["Arm Springs - Bug"],
                "체어": ["Mountain Climber"],
                "바렐": ["Side Arm Work"]
            ]),
            ("회전근개 불균형", "어깨/상체", "회전근개 근육의 불균형이 있습니다.", [
                "매트": ["Side Lying Arm Series"],
                "리포머": ["Arm Work - Salute"],
                "캐딜락": ["Tower - Rotation"],
                "체어": ["Seated Rotation"],
                "바렐": ["Spiral Stretch"]
            ]),
            ("복직근 약화", "코어/복부", "복직근이 약해 코어 안정성이 떨어집니다.", [
                "매트": ["The Hundred", "Teaser"],
                "리포머": ["Stomach Series - Hundred"],
                "캐딜락": ["Roll Down Bar"],
                "체어": ["Teaser Prep"],
                "바렐": ["Sit Up Series"]
            ]),
            ("복사근 불균형", "코어/복부", "복사근의 불균형이 있습니다.", [
                "매트": ["Criss Cross", "Saw"],
                "리포머": ["Short Box - Twist"],
                "캐딜락": ["Twist & Reach"],
                "체어": ["Side Bend"],
                "바렐": ["Twist on Barrel"]
            ]),
            ("깊은코어 약화", "코어/복부", "깊은 복부 근육이 약합니다.", [
                "매트": ["Dead Bug", "Modified Hundred"],
                "리포머": ["Footwork - Parallel"],
                "캐딜락": ["Breathing with Springs"],
                "체어": ["Seated Balance"],
                "바렐": ["Core Integration"]
            ]),
            ("흉추 과후만", "척추/등", "흉추가 과도하게 뒤로 굽어 있습니다.", [
                "매트": ["Swan", "Extension Series"],
                "리포머": ["Short Box - Arch"],
                "캐딜락": ["Monkey Stretch"],
                "체어": ["Back Extension"],
                "바렐": ["Chest Opening"]
            ]),
            ("요추 과전만", "척추/등", "요추가 과도하게 앞으로 굽어 있습니다.", [
                "매트": ["Pelvic Curl", "Imprint & Release"],
                "리포머": ["Pelvic Press", "Knee Stretches"],
                "캐딜락": ["Tower - Hip Work"],
                "체어": ["Hip Flexor Stretch"],
                "바렐": ["Hip Opening"]
            ]),
            ("척추기립근 약화", "척추/등", "척추를 세우는 근육이 약합니다.", [
                "매트": ["Swimming", "Rocking"],
                "리포머": ["Long Back Stretch"],
                "캐딜락": ["Back Extension Springs"],
                "체어": ["Swan on Chair"],
                "바렐": ["Round Back"]
            ]),
            ("고관절 굴곡근 단축", "골반/고관절", "고관절 굴곡근이 짧아져 골반이 기울어집니다.", [
                "매트": ["Hip Flexor Stretch", "Lunge"],
                "리포머": ["Lunge Series", "Runner Stretch"],
                "캐딜락": ["Tower - Hip Stretch"],
                "체어": ["Standing Lunge"],
                "바렐": ["Hip Flexor Series"]
            ]),
            ("둔근 약화", "골반/고관절", "둔근이 약해 골반 안정성이 떨어집니다.", [
                "매트": ["Bridge Series", "Clam"],
                "리포머": ["Footwork - Relevé", "Leg Press"],
                "캐딜락": ["Leg Springs - Circles"],
                "체어": ["Glute Press Back"],
                "바렐": ["Hip Extension"]
            ]),
            ("골반 불안정", "골반/고관절", "골반의 안정성이 떨어집니다.", [
                "매트": ["Single Leg Bridge", "Single Leg Stretch"],
                "리포머": ["Single Leg Work"],
                "캐딜락": ["Leg Springs - Adduction"],
                "체어": ["Standing Balance"],
                "바렐": ["Stability Challenge"]
            ]),
            ("대퇴사두근 약화", "하지", "대퇴사두근이 약합니다.", [
                "매트": ["Wall Squat", "Single Leg Squat"],
                "리포머": ["Footwork - Heels", "Squats"],
                "캐딜락": ["Leg Press Springs"],
                "체어": ["Standing Press Down"],
                "바렐": ["Leg Strengthening"]
            ]),
            ("햄스트링 단축", "하지", "햄스트링이 짧아져 무릎이 굽습니다.", [
                "매트": ["Leg Pull Front", "Roll Over"],
                "리포머": ["Hamstring Stretch", "Tendon Stretch"],
                "캐딜락": ["Tower - Leg Stretch"],
                "체어": ["Leg Pull Back"],
                "바렐": ["Hip Flexor Stretch"]
            ]),
            ("종아리 근육 긴장", "하지", "종아리 근육이 과도하게 긴장되어 있습니다.", [
                "매트": ["Calf Stretch", "Ankle Circles"],
                "리포머": ["Calf Raises", "Tendon Stretch"],
                "캐딜락": ["Foot Corrector Work"],
                "체어": ["Heel Raises"],
                "바렐": ["Ankle Mobility"]
            ])
        ]
        
        // 근육 문제 및 운동 생성
        for (index, data) in pilatesData.enumerated() {
            let problem = MuscleProblem(context: context)
            problem.name = data.problem
            problem.category = data.category
            problem.description = data.description
            
            // 해당 근육 그룹 찾기
            let groupName = data.category
            let muscleGroup = muscleGroupMap.values.first { $0.name?.contains(groupName) ?? false } ?? muscleGroupMap.values.first!
            
            // 운동 생성
            for (equipmentName, exerciseNames) in data.exercises {
                guard let equipment = equipmentMap[equipmentName] else { continue }
                
                for exerciseName in exerciseNames {
                    let exercise = Exercise(context: context)
                    exercise.name = exerciseName
                    exercise.difficulty = "중급"
                    exercise.instructions = "\(data.problem)에 효과적인 필라테스 동작입니다. 천천히 정확하게 수행하세요."
                    exercise.equipment = equipment
                    exercise.muscleGroup = muscleGroup
                    
                    // 추천 생성
                    let recommendation = ExerciseRecommendation(context: context)
                    recommendation.priority = Int16(index)
                    recommendation.muscleProblem = problem
                    recommendation.exercise = exercise
                }
            }
        }
    }
}





