//
//  CVAIntegrationService.swift
//  PilatesApp
//
//  Created on 2025-01-04.
//

import Foundation
import CoreData

struct CVAIntegrationService {
    static func mapCVAResultToMuscleProblems(cva: Double?, pelvic: Double?, knee: Double?) -> [String] {
        var problems: [String] = []
        
        // CVA 분석
        if let cva = cva {
            if cva < 50 {
                if cva < 45 {
                    problems.append("상부승모근 과긴장")
                    problems.append("목 굴곡근 약화")
                } else {
                    problems.append("상부승모근 과긴장")
                }
            }
        }
        
        // 골반 기울기 분석
        if let pelvic = pelvic {
            let abs = abs(pelvic)
            if abs > 5 {
                if pelvic > 0 {
                    problems.append("고관절 굴곡근 단축")
                    problems.append("요추 과전만")
                    problems.append("둔근 약화")
                } else {
                    problems.append("둔근 약화")
                }
            }
        }
        
        // 무릎 각도 분석
        if let knee = knee {
            if knee < 175 {
                if knee < 165 {
                    problems.append("햄스트링 단축")
                    problems.append("대퇴사두근 약화")
                } else {
                    problems.append("햄스트링 단축")
                }
            }
        }
        
        return Array(Set(problems))
    }
    
    static func getRecommendationsForProblems(
        problems: [String],
        context: NSManagedObjectContext
    ) -> [ExerciseRecommendation] {
        let request = NSFetchRequest<MuscleProblem>(entityName: "MuscleProblem")
        request.predicate = NSPredicate(format: "name IN %@", problems)
        
        guard let muscleProblems = try? context.fetch(request) else {
            return []
        }
        
        var recommendations: [ExerciseRecommendation] = []
        for problem in muscleProblems {
            if let recs = problem.recommendations as? Set<ExerciseRecommendation> {
                recommendations.append(contentsOf: Array(recs))
            }
        }
        
        return recommendations.sorted { $0.priority < $1.priority }
    }
}


















