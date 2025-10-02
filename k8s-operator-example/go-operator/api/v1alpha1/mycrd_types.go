// api/v1alpha1/mycrd_types.go
package v1alpha1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// MyCRDSpec defines the desired state of MyCRD
type MyCRDSpec struct {
	// +kubebuilder:validation:MinLength=1
	// 사용자가 넣는 메시지
	Message string `json:"message,omitempty"`
}

// MyCRDStatus defines the observed state of MyCRD
type MyCRDStatus struct {
	// 생성/동기화한 ConfigMap 이름
	ConfigMapName string `json:"configMapName,omitempty"`
	// 관측한 세대 (메타데이터 generation을 상태에 반영)
	ObservedGeneration int64 `json:"observedGeneration,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:resource:scope=Namespaced,shortName=myc
// +kubebuilder:printcolumn:name="Message",type=string,JSONPath=`.spec.message`
// +kubebuilder:printcolumn:name="ConfigMap",type=string,JSONPath=`.status.configMapName`

type MyCRD struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   MyCRDSpec   `json:"spec,omitempty"`
	Status MyCRDStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

type MyCRDList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []MyCRD `json:"items"`
}

func init() {
	SchemeBuilder.Register(&MyCRD{}, &MyCRDList{})
}
